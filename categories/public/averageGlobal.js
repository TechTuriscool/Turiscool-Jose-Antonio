import { clear } from 'console';
import axios from 'axios';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();
const port = 3000;


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

//Configuración
app.use(express.static(__dirname + "/public"));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'pages')); 

// Rutas

app.get("/", (req, res) => {
    res.render('start', { generalAverage });
});

app.get("/averageCategories", (req,res)=> res.sendFile(__dirname + "/pages/averageCategories.html"));
app.get("/averageCourses", (req,res)=> res.sendFile(__dirname + "/pages/averageCourses.html"));

const token = "Bearer 17xa7adwlycG4qrbRatBdCHW41xtl9jNyaBq4d45";
const id = "62b182eea31d8d9863079f42";
let totalCourses = 0;
let actualCourseId = 0;
let courseData = [];
let courNamesArray = [];
let courseCategoriesArray = [];
let courseIdsArray = [];
let filteredCourseList = [];
let courseListCategories = [];
let arrayOfCoursesWithForms = [];
let surveyIds = [];
let coursesWithForms = [];
let generalAverage = 10;

const axiosInstance = axios.create({
    baseURL: 'https://academy.turiscool.com/admin/api/v2',
    headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        'Lw-Client': id,
    },
});

async function fetchCourseMeta() {
    try {
        const response = await axiosInstance.get('/courses');
        totalCourses = response.data.meta.totalPages;
        await fetchCourseData();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Filtrar de todos los cursos cuales tienen formularios
async function filterCoursesWithForms() {
    for (let i = 0; i < courseData.length; i++) {
        actualCourseId = courseData[i].id;
        await fetchCourseContent(actualCourseId, courseData[i]);
    }
    console.log("coursesWithForms", coursesWithForms);
}

async function fetchCourseData() {
    try {
        const requests = [];
        for (let i = 1; i <= totalCourses; i++) {
            requests.push(axiosInstance.get(`/courses?page=${i}`));
        }

        const responses = await Promise.all(requests);

        responses.forEach(response => {
            const courses = response.data.data;
            courses.forEach(course => {
                courseIdsArray.push(course.id);
                courNamesArray.push(course.title);
                courseCategoriesArray.push(course.categories);
                //borrar repetidos de las categorias
                courseCategoriesArray = courseCategoriesArray.flat();
                courseCategoriesArray = [...new Set(courseCategoriesArray)];


                let courseObj = {
                    id: course.id,
                    title: course.title,
                    categories: [], // Crear un array de categorías específico para este curso
                    unitIdsWithForms: [] // Crear un array para almacenar las IDs de las unidades con formularios
                };

                course.categories.forEach(category => {
                    courseObj.categories.push(category);
                });

                // Añadir el objeto curso al array principal
                courseData.push(courseObj);
            });

            // Crear un array de categorías
            courses.forEach(course => {
                course.categories.forEach(category => {
                    courseListCategories.push(category);
                });
            });

            // Eliminar repetidos
            courseListCategories = courseListCategories.flat();
            courseListCategories = [...new Set(courseListCategories)];
        });

        await filterCoursesWithForms();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchCourseContent(actualCourseId, courseObj) {
    console.log("entra")
    let hasAForm = false;
    try {
        const response = await axiosInstance.get(`/courses/${actualCourseId}/contents`);

        // Asegúrate de que sections existe y es un array antes de intentar acceder a learningUnits
        const sections = response.data.sections;
        if (sections && Array.isArray(sections)) {
            // Recorre las secciones para extraer learningUnits
            sections.forEach(section => {
                // Verifica cada unidad de aprendizaje en la sección
                section.learningUnits.forEach(unit => {
                    if (unit.type === 'newSurvey') {
                        hasAForm = true;
                        surveyIds.push(unit.id);
                        courseObj.unitIdsWithForms.push(unit.id); // Añadir la ID de la unidad al objeto courseObj
                    }
                });
            });
        } else {
            console.log('No sections available or sections is not an array.');
        }

        // Pushear al array los cursos que tienen formularios
        if (hasAForm) {
            coursesWithForms.push(courseObj);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Crear una función para crear un objeto con las categorías y las unitIdsWithForms que pertenecen a esa categoría 
function createObjectWithCategoriesAndUnitIds() {
    const categoryUnitsMap = {};

    coursesWithForms.forEach(course => {
        course.categories.forEach(category => {
            if (!categoryUnitsMap[category]) {
                categoryUnitsMap[category] = [];
            }
            categoryUnitsMap[category] = categoryUnitsMap[category].concat(course.unitIdsWithForms);
        });
    });

    // Eliminar duplicados dentro de cada categoría
    for (const category in categoryUnitsMap) {
        categoryUnitsMap[category] = [...new Set(categoryUnitsMap[category])];
    }

    return categoryUnitsMap;
}

async function filterCoursesByCategory() {
    for (let i = 0; i < courseListCategories.length; i++) {
        let filteredCourses = courseData.filter(course => course.categories.includes(courseListCategories[i]));
        filteredCourseList.push({ [`${courseListCategories[i]}`]: filteredCourses.map(course => course.unitIdsWithForms).flat() });


    }
}




async function recoverySurveyInfo() {
    try {
        const requests = surveyIds.map(id => axiosInstance.get(`/assessments/${id}/responses`));
        const responses = await Promise.all(requests);

        responses.forEach(response => {
            const surveys = response.data.data;

            surveys.forEach(survey => {
                const answers = survey.answers;
                answersList.push(answers);
            });
        });
    } catch (error) {
        // Mostrar solo la palabra "error"
        console.error('Error:', error);
    }
}

//funcion para recorrer filteredCourseList y por cada categoria hacer una llamada a revocerySurveyInfo
async function recoverySurveyInfoByCategory() {
    let answersObject = {}; // Create an empty object to store the answers by category
    console.log("entra")
    for (let i = 0; i < filteredCourseList.length; i++) {
        let category = Object.keys(filteredCourseList[i])[0];
        //recorrer el array de unitIds
        for (let j = 0; j < filteredCourseList[i][category].length; j++) {
            let unitId = filteredCourseList[i][category][j];
            console.log(unitId)
            try {
                const response = await axiosInstance.get(`/assessments/${unitId}/responses`);
                const surveys = response.data.data;
                surveys.forEach(survey => {
                    const answers = survey.answers;
                    answers.forEach(answer => { // Iterate over the answers array
                        if (!answersObject[category]) {
                            answersObject[category] = []; // Create an empty array for the category if it doesn't exist
                        }
                        answersObject[category].push(answer.answer); // Push only the answer to the corresponding category array
                    });
                });
            } catch (error) {
                // Handle error
            }
        }
    }

    // Process the answersObject
    for (let category in answersObject) {
        let answers = answersObject[category];
        // Remove null values
        let answersWithoutNull = answers.filter(el => el !== null);
        // Split by '/' and get the first value without spaces
        let answersTrimed = answersWithoutNull.map(el => el.split('/')[0].trim());
        // Remove values that don't start with a numeric digit
        let answersFiltered = answersTrimed.filter(el => !isNaN(el));
        //eliminar cualquier respuesta que tenga mas de 1 caracter de longitud 
        answersFiltered = answersFiltered.filter(el => el.length === 1);
        // Convert values to numbers and calculate the average
        let sum = answersFiltered.reduce((acc, val) => acc + Number(val), 0);
        let average = sum / answersFiltered.length;
        answersObject[category] = average;
        //redondeado a 2 decimales
        answersObject[category] = Math.round(average * 100) / 100;
    }

    console.log(answersObject);
    
    //calcular la media general sumando las medias de cada categoria y dividiendo por el numero de categorias
    let sum = 0;
    for (let category in answersObject) {
        sum += answersObject[category];
    }
    generalAverage = sum / Object.keys(answersObject).length;
    generalAverage = Math.round(generalAverage * 100) / 100;
    console.log("generalAverage", generalAverage);
}

async function start() {
    await fetchCourseMeta();
    await filterCoursesByCategory();
    const categoryUnitsMap = createObjectWithCategoriesAndUnitIds();
    await recoverySurveyInfoByCategory();

}

start();
