"use strict";

export class customLeaderBoard extends HTMLElement {
    constructor() {
        super();
        this.url = "https://academy.turiscool.com/admin/api/"
        this.token = "Bearer 17xa7adwlycG4qrbRatBdCHW41xtl9jNyaBq4d45";
        this.lwId = "62b182eea31d8d9863079f42";

        this.requestOptions = {
        method: "GET",
        headers: {
            Authorization: this.token,
            "Content-Type": "application/json",
            "Lw-Client": this.lwId,
        },
        };

        this.actualuser = "";
        this.tag = "";
        this.redirect = "new-al-v2-growersgo"
        this.pages = 0;
        this.user = {};
        this.users = [];
        this.usersByTag = [];
        this.filteredUsers = [];
        this.theLastUser = {};
        this.theRecientUser = {};
        this.progress = [];
        this.progressFiltered = {
        totalCourses: 0,
        coursesStarted: 0,
        completedCourses: 0,
        courseProgress: 0,
        averageTotalCourseProgress: 0,
        totalTime: 0,
        lastCourse: 0,
        dateLastCourse: 0,
        lastSection: 0,
        };

        this.courses = [];
        this.longCourse = {
        name: "",
        time: 0,
        };
        this.shortCourse = {
        name: "",
        time: 100000000,
        };
        this.courseAbandoned = {
        name: "",
        count: 0,
        };
        this.coursePopular = {
        name: "",
        count: 0,
        };
        this.lowerCourseAverage = {
        name: "",
        average: 100000,
        };
        this.highestCourseAverage = {
        name: "",
        average: 0,
        };
        this.lastUserConected = {
        name: "",
        time: 0,
        };
        this.userConected = {
        name: "",
        time: 1000000000,
        };
    }


redirectButton() {
  window.location.href = `https://academy.turiscool.com/${redirect}`;
}

static get observedAttributes() {
    return ["data"];
}

attributeChangedCallback(attribute, oldValue, newValue) {
  if (attribute === "data" && oldValue !== newValue) {
          const data = JSON.parse(newValue);
          this.actualuser = data.actualuser;
          this.tag = data.tag;
          this.redirect = data.redirect;
          
    this.render();
        }
}

/////////////////////////// INICIO ///////////////////////////

// LLAMADA A LAS FUNCIONES UNA VEZ CARGADA LA PAGINA //
functionStart() {
  //userId = document.getElementById('el_1712750078537_354').textContent;
  this.fetchMetaProgress();

  this.fetchUser();
}



/////////////////////////// FUNCIONES DE RECOPILACION DE DATOS ///////////////////////////
fetchMetaProgress() {
    console.log(this.url);
  fetch(`${this.url}/v2/users/${this.actualuser}/progress?items_per_page=200`, this.requestOptions)
    .then(response => response.json())
    .then(metaData => {
      this.pages = metaData.meta.totalPages;
      this.fetchData();
      this.fetchMeta();
    });
}

fetchMeta() {
  this.delay(1000).then(() => {
    fetch(`${this.url}/v2/users?items_per_page=200`, this.requestOptions)
      .then(response => response.json())
      .then(metaData => {
        this.pages = metaData.meta.totalPages;
        this.fetchAlumn();
      })
  });
}

fetchData() {
  let fetchPromises = [];

  for (let i = 1; i <= this.pages; i++) {
    fetchPromises.push(
      fetch(`${this.url}/v2/users/${this.actualuser}/progress?page=${i}&items_per_page=200`, this.requestOptions)
        .then(response => response.json())
        .then(progressData => {
          for (let i = 0; i < progressData.data.length; i++) {
            this.progress.push(progressData.data[i]);
          }
        })
    );
  }

  Promise.all(fetchPromises)
    .then(() => {
      this.filterProgressUser();
    });
}

fetchUser() {
  fetch(`${this.url}/v2/users/${this.actualuser}`, this.requestOptions)
      .then(response => response.json())
      .then(userData => {
          this.user = {
              name: userData.username.toUpperCase(),
              email: userData.email,
              role: userData.role,
              createDate: userData.created,
              tags: userData.tags,
              phoneNumber: userData.fields.phone,
              address: userData.fields.address,
              country: userData.fields.country,
              company: userData.fields.company,
              birthday: userData.fields.birthday,
              nps: userData.nps_score,
              lastLogin: userData.last_login
          }
          this.showUserInfo();
      })
}


fetchAlumn() {
  let fetchPromises = [];
  this.delay(1000).then(() => {
    for (let i = 0; i < this.pages; i++) {
      fetchPromises.push(
        fetch(`${this.url}/v2/users?items_per_page=200&page=${i}`, this.requestOptions)
          .then(response => response.json())
          .then(data => {
            for (let j = 0; j < data.data.length; j++) {
              let userObject = {
                name: data.data[j].username.toUpperCase(),
                tags: data.data[j].tags,
                id: data.data[j].id,
                nps: data.data[j].nps_score,
                lastLogin: data.data[j].last_login,
              };

              this.users.push(userObject);
            }
          })
      );

    }

    Promise.allSettled(fetchPromises)
      .then(() => {
        this.searchUser();
      });
  });
}

fetchProgress() {
  let fetchPromises = [];
  this.delay(1000).then(() => {
    for (let i = 0; i < this.usersByTag.length; i++) {
      fetchPromises.push(
        fetch(`${this.url}/v2/users/${this.usersByTag[i].id}/progress`, this.requestOptions)
          .then(response => response.json())
          .then(progressData => {
            const isDuplicate = this.filteredUsers.some(user => user.userID === this.usersByTag[i].id);
            if (!isDuplicate) {
              progressData.name = this.usersByTag[i].name;
              progressData.userID = this.usersByTag[i].id;
              progressData.nps = this.usersByTag[i].nps;
              progressData.lastLogin = this.usersByTag[i].lastLogin;
              this.filteredUsers.push(progressData);
            }
          })
      );
    }

    Promise.allSettled(fetchPromises)
      .then(() => {
        console.log(this.filteredUsers);
        this.filterProgress();
      });
  });
}


/////////////////////////// FUNCIONES DE FILTRADO DE DATOS ///////////////////////////
searchUser() {
  this.users.filter(user => {
    if (user.tags.includes(this.tag)) {
      this.usersByTag.push(user);
    }
  });
  this.fetchProgress();
}

showTop10() {
  let topUsers = [];
  for (let i = 0; i < this.filteredUsers.length; i++) {
    let totalScore = 0;
    for (let j = 0; j < this.filteredUsers[i].data.length; j++) {
      totalScore += this.filteredUsers[i].data[j].average_score_rate;
    }
    let averageScore = totalScore / this.filteredUsers[i].data.length;
    averageScore = Math.trunc(averageScore * 10);
    topUsers.push({ name: this.filteredUsers[i].name, total: averageScore })
  }
  topUsers.sort((a, b) => b.total - a.total);
  return topUsers;
}

filterProgress() {
  for (let i = 0; i < this.filteredUsers.length; i++) {
    if (this.filteredUsers[i].userID === this.user.id) {
      this.user = this.filteredUsers[i];
    }
  }
  this.showTopUsers();
  this.showTopUsers3();
  this.showUserMe();
  this.showCourseInfo()
  this.filterCourses();
  this.showInfoUser();
}

courseInfo() {
  let coursesData = {
    totalCoursesCompleted: 0,
    totalTime: 0,
    averageScore: 0,
    totalNPS: 0,
    totalUnits: 0,
    countCurses: 0,
  };

  let coursesTotal = 0;
  for (let i = 0; i < this.filteredUsers.length; i++) {
    coursesData.totalNPS += this.filteredUsers[i].nps;
    coursesTotal += this.filteredUsers[i].data.length;

    this.filteredUsers[i].data.forEach(course => {
      let lessonComplete = true;

      if (course.progress_rate === 100) {
        coursesData.totalCoursesCompleted += 1;
      }
      coursesData.totalTime += course.time_on_course;
      if (course.progress_rate === 100) {
        coursesData.averageScore += course.average_score_rate / 10;
        coursesData.countCurses += 1;
      }
      coursesData.totalUnits += course.completed_units;
    });
  }

  coursesData.averageScore = coursesData.averageScore / coursesTotal;
  coursesData.averageScore = Math.round((coursesData.averageScore / coursesData.countCurses) * 100);
  coursesData.totalNPS = coursesData.totalNPS / this.filteredUsers.length;
  return coursesData;
}

filterCourses() {
  let totalScores = 0;
  let totalCourses = 0;
  let arrayCoursesAbandoned = [];
  let arrayCoursesPopular = [];

  for (let i = 0; i < this.filteredUsers.length; i++) {
    if (this.filteredUsers[i].lastLogin > this.lastUserConected.time) {
      this.lastUserConected.name = this.filteredUsers[i].name;
      this.lastUserConected.time = this.filteredUsers[i].lastLogin;
    }
    if (this.filteredUsers[i].lastLogin === 0 || this.filteredUsers[i].lastLogin === null) {
    } else {
      if (this.filteredUsers[i].lastLogin < this.userConected.time) {
        this.userConected.name = this.filteredUsers[i].name;
        this.userConected.time = this.filteredUsers[i].lastLogin;
      }
    }

    for (let j = 0; j < this.filteredUsers[i].data.length; j++) {
      let course = this.filteredUsers[i].data[j];
      let courseExists = false;
      for (let k = 0; k < this.courses.length; k++) {
        if (this.courses[k].name === course.course_id) {
          courseExists = true;
          this.courses[k].time += course.time_on_course;
          this.courses[k].progress_rate += course.progress_rate;
          this.courses[k].average += course.average_score_rate;
          this.courses[k].count += 1;
          break;
        }
      }

      if (!courseExists) {
        this.courses.push({
          name: course.course_id,
          time: course.time_on_course,
          progress_rate: course.progress_rate,
          average: course.average_score_rate,
          count: 1,
        });
        if (course.progress_rate === 0) {
          arrayCoursesAbandoned.push({
            name: course.course_id,
            count: 1,
          });
        } else if (course.progress_rate > 0) {
          arrayCoursesPopular.push({
            name: course.course_id,
            count: 1,
          });
        }
      }
    }
  }


  for (let i = 0; i < this.courses.length; i++) {
    if (this.courses[i].time > this.longCourse.time) {
      this.longCourse.name = this.courses[i].name;
      this.longCourse.time = this.courses[i].time;
    }

    if (this.courses[i].time < this.shortCourse.time) {
      this.shortCourse.name = this.courses[i].name;
      this.shortCourse.time = this.courses[i].time;
    }

    if (this.courses[i].average / this.courses[i].count < this.lowerCourseAverage.average) {
      this.lowerCourseAverage.name = this.courses[i].name;
      this.lowerCourseAverage.average = this.courses[i].average / this.courses[i].count;
    }

    if (this.courses[i].average / this.courses[i].count > this.highestCourseAverage.average) {
      this.highestCourseAverage.name = this.courses[i].name;
      this.highestCourseAverage.average = this.courses[i].average / this.courses[i].count;
    }
  }

  for (let i = 0; i < arrayCoursesAbandoned.length; i++) {
    if (arrayCoursesAbandoned[i].count > this.courseAbandoned.count) {
      this.courseAbandoned.name = arrayCoursesAbandoned[i].name;
      this.courseAbandoned.count = arrayCoursesAbandoned[i].count;
    }
  }

  for (let i = 0; i < arrayCoursesPopular.length; i++) {
    if (this.arrayCoursesPopular[i].count > this.coursePopular.count) {
      this.coursePopular.name = arrayCoursesPopular[i].name;
      this.coursePopular.count = arrayCoursesPopular[i].count;
    }
  }

}

showDate(time) {
  const date = new Date(time * 1000);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const minutes = date.getMinutes();
  const hours = date.getHours();

  let monthName = "";
  let monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  for (let i = 0; i < monthNames.length; i++) {
    if (month === i + 1) {
      monthName = monthNames[i];
    }
  }
  let finalDate = "";
  if (hours > 12) {
    finalDate = `${day} de ${monthName} de ${year}, ${hours}:${minutes} PM`;
  } else {
    finalDate = `${day} de ${monthName} de ${year}, ${hours}:${minutes} AM`;
  }
  return finalDate;
}

/////////////////////////// FUNCIONES DE VISUALIZACION DE DATOS ///////////////////////////

showUserInfo() {
  let username = document.getElementById('username');
  let age = document.getElementById('age');
  let email = document.getElementById('email');
  let div = document.createElement('p');
  let profileCard = document.querySelector('.profile-card');


  username.innerHTML = `<svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#FFFFFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>profile [#1336]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-380.000000, -2159.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M334,2011 C337.785,2011 340.958,2013.214 341.784,2017 L326.216,2017 C327.042,2013.214 330.215,2011 334,2011 M330,2005 C330,2002.794 331.794,2001 334,2001 C336.206,2001 338,2002.794 338,2005 C338,2007.206 336.206,2009 334,2009 C331.794,2009 330,2007.206 330,2005 M337.758,2009.673 C339.124,2008.574 340,2006.89 340,2005 C340,2001.686 337.314,1999 334,1999 C330.686,1999 328,2001.686 328,2005 C328,2006.89 328.876,2008.574 330.242,2009.673 C326.583,2011.048 324,2014.445 324,2019 L344,2019 C344,2014.445 341.417,2011.048 337.758,2009.673" id="profile-[#1336]"> </path> </g> </g> </g> </g></svg>
      ${this.showUndefined(this.user.name)}`;
  age.innerHTML = `<svg viewBox="0 -2.19 47.336 47.336" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Group_40" data-name="Group 40" transform="translate(-66.66 -364.396)"> <path id="Rectangle_15" data-name="Rectangle 15" d="M4.351,0H40.984a4.351,4.351,0,0,1,4.351,4.351V22.117a1,1,0,0,1-1,1H1a1,1,0,0,1-1-1V4.351A4.351,4.351,0,0,1,4.351,0Z" transform="translate(67.66 383.243)" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <path id="Path_88" data-name="Path 88" d="M113,389.249a3.778,3.778,0,0,1-3.778,3.778h0a3.779,3.779,0,0,1-3.778-3.778,3.778,3.778,0,0,1-3.778,3.778h0a3.779,3.779,0,0,1-3.778-3.778,3.778,3.778,0,0,1-3.778,3.778h0a3.779,3.779,0,0,1-3.778-3.778,3.778,3.778,0,0,1-3.778,3.778h0a3.779,3.779,0,0,1-3.778-3.778,3.778,3.778,0,0,1-3.778,3.778h0a3.778,3.778,0,0,1-3.777-3.778,3.779,3.779,0,0,1-3.778,3.778h0a3.778,3.778,0,0,1-3.778-3.778" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <g id="Group_39" data-name="Group 39"> <rect id="Rectangle_16" data-name="Rectangle 16" width="4.333" height="9.73" transform="translate(87.931 373.513)" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect> <path id="Path_89" data-name="Path 89" d="M92.825,370.333a2.727,2.727,0,1,1-5.455,0c0-1.506,2.727-4.937,2.727-4.937S92.825,368.827,92.825,370.333Z" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> </g> </g> </g></svg>
       ${this.showUndefined(this.user.birthday)} `;
  email.innerHTML = `<svg height="200px" width="200px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#000000;} </style> <g> <path class="st0" d="M510.746,110.361c-2.128-10.754-6.926-20.918-13.926-29.463c-1.422-1.794-2.909-3.39-4.535-5.009 c-12.454-12.52-29.778-19.701-47.531-19.701H67.244c-17.951,0-34.834,7-47.539,19.708c-1.608,1.604-3.099,3.216-4.575,5.067 c-6.97,8.509-11.747,18.659-13.824,29.428C0.438,114.62,0,119.002,0,123.435v265.137c0,9.224,1.874,18.206,5.589,26.745 c3.215,7.583,8.093,14.772,14.112,20.788c1.516,1.509,3.022,2.901,4.63,4.258c12.034,9.966,27.272,15.45,42.913,15.45h377.51 c15.742,0,30.965-5.505,42.967-15.56c1.604-1.298,3.091-2.661,4.578-4.148c5.818-5.812,10.442-12.49,13.766-19.854l0.438-1.05 c3.646-8.377,5.497-17.33,5.497-26.628V123.435C512,119.06,511.578,114.649,510.746,110.361z M34.823,99.104 c0.951-1.392,2.165-2.821,3.714-4.382c7.689-7.685,17.886-11.914,28.706-11.914h377.51c10.915,0,21.115,4.236,28.719,11.929 c1.313,1.327,2.567,2.8,3.661,4.272l2.887,3.88l-201.5,175.616c-6.212,5.446-14.21,8.443-22.523,8.443 c-8.231,0-16.222-2.99-22.508-8.436L32.19,102.939L34.823,99.104z M26.755,390.913c-0.109-0.722-0.134-1.524-0.134-2.341V128.925 l156.37,136.411L28.199,400.297L26.755,390.913z M464.899,423.84c-6.052,3.492-13.022,5.344-20.145,5.344H67.244 c-7.127,0-14.094-1.852-20.142-5.344l-6.328-3.668l159.936-139.379l17.528,15.246c10.514,9.128,23.922,14.16,37.761,14.16 c13.89,0,27.32-5.032,37.827-14.16l17.521-15.253L471.228,420.18L464.899,423.84z M485.372,388.572 c0,0.803-0.015,1.597-0.116,2.304l-1.386,9.472L329.012,265.409l156.36-136.418V388.572z"></path> </g> </g></svg>
       ${this.showUndefined(this.user.email)}`;

  div.innerHTML = `<p><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 5.5C21 14.0604 14.0604 21 5.5 21C5.11378 21 4.73086 20.9859 4.35172 20.9581C3.91662 20.9262 3.69906 20.9103 3.50103 20.7963C3.33701 20.7019 3.18146 20.5345 3.09925 20.364C3 20.1582 3 19.9181 3 19.438V16.6207C3 16.2169 3 16.015 3.06645 15.842C3.12515 15.6891 3.22049 15.553 3.3441 15.4456C3.48403 15.324 3.67376 15.255 4.05321 15.117L7.26005 13.9509C7.70153 13.7904 7.92227 13.7101 8.1317 13.7237C8.31637 13.7357 8.49408 13.7988 8.64506 13.9058C8.81628 14.0271 8.93713 14.2285 9.17882 14.6314L10 16C12.6499 14.7999 14.7981 12.6489 16 10L14.6314 9.17882C14.2285 8.93713 14.0271 8.81628 13.9058 8.64506C13.7988 8.49408 13.7357 8.31637 13.7237 8.1317C13.7101 7.92227 13.7904 7.70153 13.9509 7.26005L13.9509 7.26005L15.117 4.05321C15.255 3.67376 15.324 3.48403 15.4456 3.3441C15.553 3.22049 15.6891 3.12515 15.842 3.06645C16.015 3 16.2169 3 16.6207 3H19.438C19.9181 3 20.1582 3 20.364 3.09925C20.5345 3.18146 20.7019 3.33701 20.7963 3.50103C20.9103 3.69907 20.9262 3.91662 20.9581 4.35173C20.9859 4.73086 21 5.11378 21 5.5Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
         ${this.showUndefined(this.user.phoneNumber)}</p>
      <p><svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M30.216 9.318l-5.598-6c-0.19-0.203-0.454-0.317-0.732-0.317h-8.348l-0.031-2.063c0-0.517-0.448-0.938-1-0.938s-0.938 0.42-0.938 0.938l-0.030 2.063h-11.024c-0.552 0-1 0.447-1 1v12c0 0.552 0.448 1 1 1h11.011v14.063c0 0.517 0.448 0.938 1 0.938s1-0.42 1-0.938v-14.063h8.361c0.277 0 0.542-0.115 0.732-0.317l5.598-6c0.358-0.384 0.358-0.98 0-1.365zM23.452 15h-19.936v-10h19.936l4.665 5z"></path> </g></svg>
         ${this.showUndefined(this.user.address)}</p>
      <p><svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path clip-rule="evenodd" d="M10 7.88974C11.1046 7.88974 12 6.98912 12 5.87814C12 4.76716 11.1046 3.86654 10 3.86654C8.89543 3.86654 8 4.76716 8 5.87814C8 6.98912 8.89543 7.88974 10 7.88974ZM10 6.5822C10.3866 6.5822 10.7 6.26698 10.7 5.87814C10.7 5.4893 10.3866 5.17408 10 5.17408C9.6134 5.17408 9.3 5.4893 9.3 5.87814C9.3 6.26698 9.6134 6.5822 10 6.5822Z" fill="#000000" fill-rule="evenodd"></path><path clip-rule="evenodd" d="M5.15 5.62669C5.15 3.0203 7.37393 1 10 1C12.6261 1 14.85 3.0203 14.85 5.62669C14.85 6.06012 14.8114 6.53528 14.7269 7.03578L18 7.8588L25.7575 5.90818C26.0562 5.83306 26.3727 5.90057 26.6154 6.09117C26.8581 6.28178 27 6.57423 27 6.88395V23.9826C27 24.4441 26.6877 24.8464 26.2425 24.9584L18.2425 26.97C18.0833 27.01 17.9167 27.01 17.7575 26.97L10 25.0193L2.24254 26.97C1.94379 27.0451 1.6273 26.9776 1.38459 26.787C1.14187 26.5964 1 26.3039 1 25.9942V8.89555C1 8.43402 1.3123 8.03172 1.75746 7.91978L5.2731 7.03578C5.18863 6.53528 5.15 6.06012 5.15 5.62669ZM10 2.70986C8.20779 2.70986 6.85 4.06691 6.85 5.62669C6.85 7.21686 7.5125 9.57287 9.40979 11.3615C9.74241 11.6751 10.2576 11.6751 10.5902 11.3615C12.4875 9.57287 13.15 7.21686 13.15 5.62669C13.15 4.06691 11.7922 2.70986 10 2.70986ZM5.80904 8.97453L3.22684 9.62382C3.09349 9.65735 3 9.77726 3 9.91476V24.3212C3 24.5165 3.18371 24.6598 3.37316 24.6121L8.77316 23.2543C8.90651 23.2208 9 23.1009 9 22.9634V13.2506C7.40353 12.024 6.39235 10.4792 5.80904 8.97453ZM11 13.2506V22.9634C11 23.1009 11.0935 23.2208 11.2268 23.2543L16.6268 24.6121C16.8163 24.6598 17 24.5165 17 24.3212V9.91477C17 9.77726 16.9065 9.65735 16.7732 9.62382L14.191 8.97453C13.6076 10.4792 12.5965 12.024 11 13.2506ZM25 22.9634C25 23.1009 24.9065 23.2208 24.7732 23.2543L19.3732 24.6121C19.1837 24.6598 19 24.5165 19 24.3212V9.91477C19 9.77726 19.0935 9.65736 19.2268 9.62382L24.6268 8.26599C24.8163 8.21835 25 8.36159 25 8.55693V22.9634Z" fill="#000000" fill-rule="evenodd"></path></g></svg>
         ${this.showUndefined(this.user.country)} </p>
      <p><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style>.cls-1,.cls-2{fill:none;stroke:#020202;stroke-miterlimit:10;stroke-width:1.91px;}.cls-1{stroke-linecap:square;}</style> </defs> <g id="briefcase_simple" data-name="briefcase simple"> <rect class="cls-1" x="1.5" y="6.27" width="21" height="15.27" rx="1.91"></rect> <path class="cls-2" d="M13.91,13h4.77A3.81,3.81,0,0,0,22.5,9.14v-1a1.91,1.91,0,0,0-1.91-1.91H3.41A1.91,1.91,0,0,0,1.5,8.18v1A3.81,3.81,0,0,0,5.32,13h8.59Z"></path> <line class="cls-1" x1="12" y1="12" x2="12" y2="13.91"></line> <polygon class="cls-1" points="15.82 6.27 8.18 6.27 9.14 2.46 14.86 2.46 15.82 6.27"></polygon> </g> </g></svg>
         ${this.showUndefined(this.user.company)} </p>
      <p><svg viewBox="-1 0 22 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>profile_plus [#1337]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-340.000000, -2159.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M298,2005 C298,2002.794 296.206,2001 294,2001 C291.794,2001 290,2002.794 290,2005 C290,2007.206 291.794,2009 294,2009 C296.206,2009 298,2007.206 298,2005 L298,2005 Z M304,2019 L299,2019 L299,2017 L301.784,2017 C300.958,2013.214 297.785,2011 294,2011 C290.215,2011 287.042,2013.214 286.216,2017 L289,2017 L289,2019 L284,2019 C284,2014.445 286.583,2011.048 290.242,2009.673 C288.876,2008.574 288,2006.89 288,2005 C288,2001.686 290.686,1999 294,1999 C297.314,1999 300,2001.686 300,2005 C300,2006.89 299.124,2008.574 297.758,2009.673 C301.417,2011.048 304,2014.445 304,2019 L304,2019 Z M295,2017 L297,2017 L297,2019 L295,2019 L295,2021 L293,2021 L293,2019 L291,2019 L291,2017 L293,2017 L293,2015 L295,2015 L295,2017 Z" id="profile_plus-[#1337]"> </path> </g> </g> </g> </g></svg>
         ${this.showDate(this.user.createDate)} </p>
      <p><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 7V12H15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
         ${this.showDate(this.user.lastLogin)}</p> 
      `;

  profileCard.appendChild(div);
}

showProgressInfo() {
  let courses = document.getElementById('course-card-courses');
  let startCourses = document.getElementById('course-card-start-courses');
  let progressRate = document.getElementById('course-card-progress');
  let average = document.getElementById('course-card-average');
  let time = document.getElementById('course-card-time');
  let lastCourse = document.getElementById('course-card-last-course');
  let endCourse = document.getElementById('course-card-end-courses');

  courses.innerHTML = `${this.progressFiltered.totalCourses}`;
  startCourses.innerHTML = `${this.progressFiltered.coursesStarted}`;
  progressRate.value = `${this.progressFiltered.completedCourses}`;
  average.innerHTML = `${this.progressFiltered.averageTotalCourseProgress}`;
  time.innerHTML = `${this.progressFiltered.totalTime} minutos`;

  this.progressFiltered.lastCourse = this.progressFiltered.lastCourse.replace(/-/g, " ");

  lastCourse.innerHTML = `${this.progressFiltered.lastCourse} 
    <br><strong>Fecha:</strong> ${this.showDate(this.progressFiltered.dateLastCourse)}`;
  endCourse.innerHTML = `${this.progressFiltered.completedCourses}`;
}

async showTopUsers() {
  let datosRecibidos = false;
  let topUsers = await this.showTop10();
  console.log(topUsers);
  let row = document.getElementById("top10Users");
  let spinner = document.querySelector(".loader");

  if (topUsers.length >= 10) {
    for (let i = 0; i < 10; i++) {
      datosRecibidos = true;
      if (datosRecibidos) {
        spinner.style.display = 'none';
      }
      let fila = document.createElement("tr");
      fila.innerHTML = `<td>${i + 1}</td><td>${topUsers[i].name}</td><td>${topUsers[i].total}</td>`;
      row.appendChild(fila);
    }
  } else {
    for (let i = 0; i < topUsers.length; i++) {
      datosRecibidos = true;
      if (datosRecibidos) {
        spinner.style.display = 'none';
      }
      let fila = document.createElement("tr");
      fila.innerHTML = `<td>${i + 1}</td><td>${topUsers[i].name}</td><td>${topUsers[i].total}</td>`;
      row.appendChild(fila);
    }
  }
}

async showTopUsers3() {
  let topUsers = await this.showTop10();

  for (let i = 0; i < 3; i++) {
    let position = document.getElementById(`position${i + 1}`);
    position.innerText = `${i + 1}º - ${topUsers[i].name}`;

  }
}

async showUserMe() {
  let datosRecibidos = false;
  let actualPosition = document.getElementById("actualPosition");
  let position = await this.showTop10();

  for (let i = 0; i < position.length; i++) {
    if (position[i].name === this.user.name) {
      datosRecibidos = true;
      actualPosition.innerHTML = `${i + 1}`;
      if (datosRecibidos) {
        actualPosition.classList.remove('loading');
      }
    }
  }
}

async showCourseInfo() {
  let datosRecibidos = false;
  let coursesData = await this.courseInfo();
  if (coursesData) {
    datosRecibidos = true;
  }
  let courses = document.getElementById("statistic-courses");
  courses.innerHTML = `${coursesData.totalCoursesCompleted} cursos`;

  let time = document.getElementById("statistic-hours");
  coursesData.totalTime = Math.round(coursesData.totalTime / 60);
  time.innerHTML = `${coursesData.totalTime} horas`;

  let lessons = document.getElementById("statistic-units");
  lessons.innerHTML = `${coursesData.totalUnits} lecciones`;

  if (datosRecibidos) {
    courses.classList.remove('loading');
    time.classList.remove('loading');
    lessons.classList.remove('loading');
  }
}

async showInfoUser() {
  let datosRecibidos = false;
  datosRecibidos = true;
  let userName = document.getElementById('user-info-name');
  let userDate = document.getElementById('user-info-date');

  userName.innerHTML = `${this.lastUserConected.name}`;
  userDate.innerHTML = `${this.showDate(this.lastUserConected.time)}`;

  if (datosRecibidos) {
    userName.classList.remove('loading');
    userDate.classList.remove('loading');
  }
}

async filterProgressUser() {
  this.progressFiltered.totalCourses = this.progress.length;
  let totalProgress = 0;
  let totalTime = 0;

  for (let i = 0; i < this.progress.length; i++) {
    if (this.progress[i].progress_rate > 0 && this.progress[i].progress_rate < 100) {
      this.progressFiltered.coursesStarted += 1;
    } else if (this.progress[i].progress_rate === 100) {
      this.progressFiltered.completedCourses += 1;
      totalProgress += this.progress[i].average_score_rate / 10;
    }

    totalTime += this.progress[i].time_on_course;
    if (this.progressFiltered.dateLastCourse < this.progress[i].completed_at) {
      this.progressFiltered.dateLastCourse = this.progress[i].completed_at;
      this.progressFiltered.lastCourse = this.progress[i].course_id;
      this.progressFiltered.lastSection = this.progress[i].progress_per_section_unit[0].section_id;
    }
  }

  this.progressFiltered.courseProgress = this.progressFiltered.completedCourses / this.progressFiltered.totalCourses * 100;
  this.progressFiltered.courseProgress = Math.round(this.progressFiltered.courseProgress);

  this.progressFiltered.averageTotalCourseProgress = totalProgress / this.progressFiltered.completedCourses;
  this.progressFiltered.averageTotalCourseProgress = Math.round(this.progressFiltered.averageTotalCourseProgress);

  this.progressFiltered.totalTime = totalTime;

  this.showProgressInfo();
}

showUndefined(text) {
  if (text === undefined) {
    return "No disponible";
  } else {
    return text;
  }
}

async delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

render() {
  
    this.innerHTML = `
    <img class="background" style:"opacity:0.3" src="https://i.ibb.co/0Qvb5Yj/mosaico.png" alt="Fondo" />
        <div class="logo" style="padding-left:40px "><img src="https://i.ibb.co/ctyfr3d/logo.png" alt="Logo" /></div>
      
        <div class="container impar">
          <div class="container-content">
            <div class="profile-card">
              <h2>Perfil de usuario</h2>
              <p id="username"></p>
              <p id="age"><strong>Edad:</strong> 25 años</p>
              <p id="email"><strong>Email:</strong> juan@example.com</p>
      
            </div>
            <div class="course-card">
              <div class="title-course">Resumen de mis cursos</div>
              <div class="containerCourse">
                <div class="h3"><svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M1750.21 0v1468.235h-225.882v338.824h169.412V1920H451.387c-82.447 0-161.506-36.141-214.701-99.388-43.934-51.953-67.652-116.33-67.652-182.965V282.353C169.034 126.494 295.528 0 451.387 0H1750.21Zm-338.823 1468.235H463.81c-89.223 0-166.136 59.86-179.576 140.047-1.242 9.036-2.259 18.07-2.259 27.106v2.26c0 40.658 13.553 77.928 40.659 109.552 32.753 38.4 79.059 59.859 128.753 59.859h960v-112.941H409.599v-112.942h1001.788v-112.94Zm225.882-1355.294H451.387c-92.725 0-169.412 75.67-169.412 169.412v1132.8c50.824-37.27 113.958-59.859 181.835-59.859h1173.46V112.941ZM1354.882 903.53v112.942H564.294V903.529h790.588Zm56.47-564.705v451.764H507.825V338.824h903.529Zm-112.94 112.94H620.765v225.883h677.647V451.765Z"
                        fill-rule="evenodd"></path>
                    </g>
                  </svg> Cursos totales:</div class="h3">
                <p id="course-card-courses"></p>
              </div>
              <div class="containerCourse">
                <div class="h3"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M4.25 3l1.166-.624 8 5.333v1.248l-8 5.334-1.166-.624V3zm1.5 1.401v7.864l5.898-3.932L5.75 4.401z">
                      </path>
                    </g>
                  </svg> Cursos empezados:</div class="h3">
                <p id="course-card-start-courses"></p>
              </div>
              <div class="containerCourse">
                <div class="h3"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <g id="style=stroke">
                        <g id="check-box">
                          <path id="vector (Stroke)" fill-rule="evenodd" clip-rule="evenodd"
                            d="M16.5303 8.96967C16.8232 9.26256 16.8232 9.73744 16.5303 10.0303L11.9041 14.6566C11.2207 15.34 10.1126 15.34 9.42923 14.6566L7.46967 12.697C7.17678 12.4041 7.17678 11.9292 7.46967 11.6363C7.76256 11.3434 8.23744 11.3434 8.53033 11.6363L10.4899 13.5959C10.5875 13.6935 10.7458 13.6935 10.8434 13.5959L15.4697 8.96967C15.7626 8.67678 16.2374 8.67678 16.5303 8.96967Z"
                            fill="#000000"></path>
                          <path id="vector (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd"
                            d="M1.25 8C1.25 4.27208 4.27208 1.25 8 1.25H16C19.7279 1.25 22.75 4.27208 22.75 8V16C22.75 19.7279 19.7279 22.75 16 22.75H8C4.27208 22.75 1.25 19.7279 1.25 16V8ZM8 2.75C5.10051 2.75 2.75 5.10051 2.75 8V16C2.75 18.8995 5.10051 21.25 8 21.25H16C18.8995 21.25 21.25 18.8995 21.25 16V8C21.25 5.10051 18.8995 2.75 16 2.75H8Z"
                            fill="#000000"></path>
                        </g>
                      </g>
                    </g>
                  </svg> Cursos finalizados:</div class="h3">
                <p id="course-card-end-courses"></p>
              </div>
              <div class="progreso">
                <div class="h3"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M5 5C2.23858 5 0 7.23858 0 10V14C0 16.7614 2.23858 19 5 19H19C21.7614 19 24 16.7614 24 14V10C24 7.23858 21.7614 5 19 5H5ZM2 10C2 8.34315 3.34315 7 5 7H19C20.6569 7 22 8.34315 22 10V14C22 15.6569 20.6569 17 19 17H5C3.34315 17 2 15.6569 2 14V10ZM6 9C4.89543 9 4 9.89543 4 11V13C4 14.1046 4.89543 15 6 15C7.10457 15 8 14.1046 8 13V11C8 9.89543 7.10457 9 6 9Z"
                        fill="#000000"></path>
                    </g>
                  </svg></div class="h3">Progreso:<progress id="course-card-progress" value="25" min="0" max="100"></progress>
              </div>
              <div class="containerCourse">
                <div class="h3"><svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M22,7H16.333V4a1,1,0,0,0-1-1H8.667a1,1,0,0,0-1,1v7H2a1,1,0,0,0-1,1v8a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V8A1,1,0,0,0,22,7ZM7.667,19H3V13H7.667Zm6.666,0H9.667V5h4.666ZM21,19H16.333V9H21Z">
                      </path>
                    </g>
                  </svg> Nota media:</div class="h3">
                <p id="course-card-average"></p>
              </div>
              <div class="containerCourse">
                <div class="h3"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM3.00683 12C3.00683 16.9668 7.03321 20.9932 12 20.9932C16.9668 20.9932 20.9932 16.9668 20.9932 12C20.9932 7.03321 16.9668 3.00683 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12Z"
                        fill="#0F0F0F"></path>
                      <path
                        d="M12 5C11.4477 5 11 5.44771 11 6V12.4667C11 12.4667 11 12.7274 11.1267 12.9235C11.2115 13.0898 11.3437 13.2343 11.5174 13.3346L16.1372 16.0019C16.6155 16.278 17.2271 16.1141 17.5032 15.6358C17.7793 15.1575 17.6155 14.5459 17.1372 14.2698L13 11.8812V6C13 5.44772 12.5523 5 12 5Z"
                        fill="#0F0F0F"></path>
                    </g>
                  </svg> Tiempo total estudiado: </div class="h3">
                <p id="course-card-time"></p>
              </div>
              <div class="containerCourse">
                <div class="h3"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M23 12C23 12.3545 22.9832 12.7051 22.9504 13.051C22.3838 12.4841 21.7204 12.014 20.9871 11.6675C20.8122 6.85477 16.8555 3.00683 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12C3.00683 16.8555 6.85477 20.8122 11.6675 20.9871C12.014 21.7204 12.4841 22.3838 13.051 22.9504C12.7051 22.9832 12.3545 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12Z"
                        fill="#0F0F0F"></path>
                      <path
                        d="M13 11.8812L13.8426 12.3677C13.2847 12.7802 12.7902 13.2737 12.3766 13.8307L11.5174 13.3346C11.3437 13.2343 11.2115 13.0898 11.1267 12.9235C11 12.7274 11 12.4667 11 12.4667V6C11 5.44771 11.4477 5 12 5C12.5523 5 13 5.44772 13 6V11.8812Z"
                        fill="#0F0F0F"></path>
                      <path
                        d="M15.2929 17.7071C15.6834 17.3166 16.3166 17.3166 16.7071 17.7071L17.3482 18.3482L19.2473 16.4491C19.6379 16.0586 20.271 16.0586 20.6615 16.4491C21.0521 16.8397 21.0521 17.4728 20.6615 17.8634L18.1213 20.4036C18.0349 20.49 17.9367 20.5573 17.8318 20.6054C17.4488 20.8294 16.9487 20.7772 16.6203 20.4487L15.2929 19.1213C14.9024 18.7308 14.9024 18.0976 15.2929 17.7071Z"
                        fill="#0F0F0F"></path>
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M18 24C21.3137 24 24 21.3137 24 18C24 14.6863 21.3137 12 18 12C14.6863 12 12 14.6863 12 18C12 21.3137 14.6863 24 18 24ZM18 22.0181C15.7809 22.0181 13.9819 20.2191 13.9819 18C13.9819 15.7809 15.7809 13.9819 18 13.9819C20.2191 13.9819 22.0181 15.7809 22.0181 18C22.0181 20.2191 20.2191 22.0181 18 22.0181Z"
                        fill="#0F0F0F"></path>
                    </g>
                  </svg> Último curso terminado: </div class="h3">
                <p id="course-card-last-course"></p>
              </div>
            </div>
          </div>
        </div>
        </div>
      
        <div class="container par">
          <div class="container-content">
            <div class="user-info">
              <h4>Último usuario conectado</h4>
              <h2 id="user-info-name" class="loading">Cargando</h2>
            </div>
            <div class="user-info">
              <h4>Última conexion</h4>
              <h2 id="user-info-date" class="loading">Cargando</h2>
            </div>
          </div>
      
        </div>
      
        <div class="container impar">
      
          <h1 class="tituloTuEscuela">TU ESCUELA</h1>
          <div class="container-content">
      
            <div class="table-section">
              <h2>Top 10 alumnos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Nombre</th>
                    <th>Puntuación</th>
                  </tr>
                </thead>
                <tbody id="top10Users">
                </tbody>
              </table>
              <div class="loader"></div>
            </div>
            <div>
              <div>
                <div class="podio">
                  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="enable-background:new 0 0 1024 1024"
                    xml:space="preserve" fill="#000000">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M918.4 201.6c-6.4-6.4-12.8-9.6-22.4-9.6H768V96c0-9.6-3.2-16-9.6-22.4C752 67.2 745.6 64 736 64H288c-9.6 0-16 3.2-22.4 9.6C259.2 80 256 86.4 256 96v96H128c-9.6 0-16 3.2-22.4 9.6-6.4 6.4-9.6 16-9.6 22.4 3.2 108.8 25.6 185.6 64 224 34.4 34.4 77.56 55.65 127.65 61.99 10.91 20.44 24.78 39.25 41.95 56.41 40.86 40.86 91 65.47 150.4 71.9V768h-96c-9.6 0-16 3.2-22.4 9.6-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4c6.4 6.4 12.8 9.6 22.4 9.6h256c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-12.8 9.6-22.4s-3.2-16-9.6-22.4c-6.4-6.4-12.8-9.6-22.4-9.6h-96V637.26c59.4-7.71 109.54-30.01 150.4-70.86 17.2-17.2 31.51-36.06 42.81-56.55 48.93-6.51 90.02-27.7 126.79-61.85 38.4-38.4 60.8-112 64-224 0-6.4-3.2-16-9.6-22.4zM256 438.4c-19.2-6.4-35.2-19.2-51.2-35.2-22.4-22.4-35.2-70.4-41.6-147.2H256v182.4zm390.4 80C608 553.6 566.4 576 512 576s-99.2-19.2-134.4-57.6C342.4 480 320 438.4 320 384V128h384v256c0 54.4-19.2 99.2-57.6 134.4zm172.8-115.2c-16 16-32 25.6-51.2 35.2V256h92.8c-6.4 76.8-19.2 124.8-41.6 147.2zM768 896H256c-9.6 0-16 3.2-22.4 9.6-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4c6.4 6.4 12.8 9.6 22.4 9.6h512c9.6 0 16-3.2 22.4-9.6 6.4-6.4 9.6-12.8 9.6-22.4s-3.2-16-9.6-22.4c-6.4-6.4-12.8-9.6-22.4-9.6z"
                        fill="#000000"></path>
                    </g>
                  </svg>
                  <div class="ganador" style="display: flex; justify-content: center; align-items: center;">
                    <h1 id="position1"></h1><img class="spinerVisible" style="height: 20px;" src="spiner.gif" alt="">
                  </div>
                  <div class="segundo" style="display: flex; justify-content: center; align-items: center;">
                    <h1 id="position2"></h1><img class="spinerVisible" style="height: 20px;" src="spiner.gif" alt="">
                  </div>
                  <div class="tercero" style="display: flex; justify-content: center; align-items: center;">
                    <h1 id="position3"></h1><img class="spinerVisible" style="height: 20px;" src="spiner.gif" alt="">
                  </div>
                </div>
                <div class="position-circle">
                  <h2>Tu ranking</h2>
                  <svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M923.2 429.6H608l-97.6-304-97.6 304H97.6l256 185.6L256 917.6l256-187.2 256 187.2-100.8-302.4z"
                        fill="#FAD97F"></path>
                      <path
                        d="M1024 396H633.6L512 21.6 390.4 396H0l315.2 230.4-121.6 374.4L512 770.4l316.8 232L707.2 628 1024 396zM512 730.4l-256 187.2 97.6-302.4-256-185.6h315.2l97.6-304 97.6 304h315.2l-256 185.6L768 917.6l-256-187.2z"
                        fill=""></path>
                    </g>
                    <p id="actualPosition"></p>
                  </svg>
                </div>
              </div>
            </div>
          </div>
      
        </div>
      
      
        <div class="container par statistics">
          <h1 class="tituloTuEscuela">TOTAL DE TU ESCUELA</h1>
          <div class="container-content2">
            <div class="statistic">
      
              <h2>Horas estudiadas</h2>
              <p id="statistic-hours" class="loading">Cargando</p>
            </div>
            <div class="statistic">
              <h2>Cursos realizados</h2>
              <p id="statistic-courses" class="loading">Cargando</p>
            </div>
            <div class="statistic" class="loading">
              <h2>Lecciones completadas</h2>
              <p id="statistic-units" class="loading">Cargando</p>
            </div>
          </div>
        </div>
      
        <button class="btn" onclick="redirectButton()">VOLVER</button>
    `;
    this.functionStart();

};


}

window.customElements.define('custom-leaderboard', customLeaderBoard);