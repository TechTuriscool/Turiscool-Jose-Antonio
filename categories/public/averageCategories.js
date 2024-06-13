let token = "Bearer 17xa7adwlycG4qrbRatBdCHW41xtl9jNyaBq4d45";
let id = "62b182eea31d8d9863079f42";
let arrayNamesForbidden = ["feet", "bienvenidos", "onboarding", "procedimientos", "taz", "alda"];
let totalCourses = 0;
let courseList = [];
let answersList = [];
let filteredCourseList = [];
let courseListCategories = [];
let arrayOfCoursesWithForms = [];
let surveyIds = [
    '6630dc6d6352165dab0a521c',
    '663e42049182a7e0fe02c5ea',
    '663ce93d82bfd96c2f08b135',
    '663cdabec7a309fe580e0c4c',
    '663cccdd8c487bdef10b73d1',
    '663ca577439d3358b409686d',
    '663c8d95ee285398f90990b8',
    '6638c998a8fa16d482065f95',
    '6644c4cfcfbfe7e0b6069102',
    '662fd300210f193e120a10f7',
    '662fc1ccc88c1385cc075104',
    '661d0a17106e4847670a46c8',
    '662a74d33983a959b707605e',
    '662b8b70a11e99b6610bdcd5',
    '6630dc6d6352165dab0a521c',
    '662a77a9d5d43be05d0d3080',
    '662a77fece908041e409852c',
    '662a7833e7582ab91b0c61c5',
    '663a5c6632fbf8457c05af44',
    '663a5b85d524529d42000f44',
    '663900a6878592544f031ee4',
    '663a5c8e9099f4f52d03110d',
    '65bbb01a0bded8ccd901e153',
    '65cb8ae20c03671c4c0f217c',
    '65cb8b5525e8dd6426042aa4',
    '661d035f49005ddb9207ded4',
    '65ce333ce1b3f84feb08ddfd',
    '65ce2a0b4de66a5bc2009213',
    '65ce2c3b1ee372345a09389d',
    '65ce2c88209a1e698c04dfee',
    '65ce2d67a786d4aa87094dec',
    '64bfc5b5fa623555eb0f1ea1',
    '64b90d8cb34247785a0deaad',
    '6630dc9eeced332b720c06c3'
];
let actualCourseId = "formacion-excel-para-alojamientos-turisticos";

let requestOptions = {
    method: "GET",
    headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "Lw-Client": id,
    },
};

async function fetchCourseMeta() {
    try {
        let response = await fetch(`https://academy.turiscool.com/admin/api/v2/courses`, requestOptions);
        response = await response.json();
        console.log(response);
        totalCourses = response.meta.totalPages;
        await fetchCourseData();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchCourseData() {
    try {
        for (let i = 1; i <= totalCourses; i++) {
            let response = await fetch(`https://academy.turiscool.com/admin/api/v2/courses?page=${i}`, requestOptions);
            response = await response.json();
            let courses = response.data;

            courses.forEach(course => {
                if (arrayNamesForbidden.includes(course.name)) {
                    return;
                }
                courseList.push(course);
                courseListCategories.push(course.categories);


            });
        }
        await filterForbiddenCourses();
        getArrayOfIds();
        getArrayOfCourseNames();
        getArrayOfCOurseCategories();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchCourseContent(actualCourseId) {
    let hasAForm = false;
    try {
        let response = await fetch(`https://academy.turiscool.com/admin/api/v2/courses/${actualCourseId}/contents`, requestOptions);
        response = await response.json();
        
        // Asegúrate de que sections existe y es un array antes de intentar acceder a learningUnits
        let sections = response.sections;
        if (sections && Array.isArray(sections)) {
            // Recorre las secciones para extraer learningUnits
            sections.forEach(section => {

                // Verifica cada unidad de aprendizaje en la sección
                section.learningUnits.forEach(unit => {
                    if (unit.type === 'newSurvey') {
                        hasAForm = true;
                        surveyIds.push(unit.id);
                    }
                });
            });
        } else {
            console.log('No sections available or sections is not an array.');
        }
        //pushear a un array los cursos que tienen formularios
        if (hasAForm) {
            arrayOfCoursesWithForms.push(actualCourseId);
        }


    } catch (error) {
        console.error('Error:', error);
    }
}

async function runAllCoursesAndCheckfIfHasForm() {
    console.log("running...")
    for (let i = 0; i < filteredCourseList.length; i++) {
        if (i % 2 === 0) {
            console.log("*");
        } else {
            console.log("-");
        }
        await fetchCourseContent(filteredCourseList[i].id);
    }
}

function getArrayOfIds() {
    let arrayIds = [];
    courseList.forEach(course => {
        arrayIds.push(course.id);
    });
    return arrayIds;
}

function getArrayOfCourseNames() {
    let arrayCourseNames = [];
    courseList.forEach(course => {
        arrayCourseNames.push(course.title);
    });
    return arrayCourseNames;
}

function getArrayOfCOurseCategories() {
    let arrayCourseCategories = [];
    courseListCategories.forEach(course => {
        arrayCourseCategories.push(course);
    });

    //filtrar categorias repetidas
    arrayCourseCategories = arrayCourseCategories.flat();
    arrayCourseCategories = [...new Set(arrayCourseCategories)];
    return arrayCourseCategories;
}

async function filterForbiddenCourses() {
    filteredCourseList = courseList.filter(course => !arrayNamesForbidden.includes(course.name));
}

async function start() {
    console.log("start");
    await fetchCourseMeta();
    await fetchCourseContent(actualCourseId);
    //await runAllCoursesAndCheckfIfHasForm();
    await recoverySurveyInfo();
    getIndividualAnswersFromAnswersList();
}

async function recoverySurveyInfo() {
    try {
        for (let i = 0; i < surveyIds.length; i++) {
            let response = await fetch(`https://academy.turiscool.com/admin/api/v2/assessments/66549bcfecbf692ab60b3928/responses`, requestOptions);
            response = await response.json();
            
            let surveys = response.data;

            surveys.forEach(survey => {
                let answers = survey.answers;
                answersList.push(answers);
            });
        }
    } catch (error) {
        // Mostrar solo la palabra "error"
    }
}

function getIndividualAnswersFromAnswersList() {
    let individualAnswers = [];

    // Extraer respuestas individuales
    answersList.forEach(answers => {
        answers.forEach(answer => {
            if (answer && typeof answer.answer === 'string') {
                individualAnswers.push(answer.answer);
            }
        });
    });

    // Eliminar las opciones que sean null
    individualAnswers = individualAnswers.filter(answer => answer != null);

    // Eliminar las que no empiecen por un número
    individualAnswers = individualAnswers.filter(answer => !isNaN(answer.charAt(0)));

    // eliminar todo lo que este despues de cada /
    individualAnswers = individualAnswers.map(answer => {
        let index = answer.indexOf('/');
        return answer.substring(0, index);
    });

    // calcular la media

    let sum = 0;
    individualAnswers.forEach(answer => {
        sum += parseInt(answer);
    });

    let average = sum / individualAnswers.length;
    //redondear a 2 decimales

    average = Math.round(average * 100) / 100;

    let averageScoreDiv = document.getElementById('averageScore');
    averageScoreDiv.style.backgroundColor = "red";
    averageScoreDiv.innerHTML = average;
    
    console.log("media turiscool", average);


}

start();