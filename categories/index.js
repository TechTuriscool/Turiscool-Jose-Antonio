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


// Rutas

app.get("/", (req,res)=> res.sendFile(__dirname + "/pages/start.html"));
app.get("/averageCategories", (req,res)=> res.sendFile(__dirname + "/pages/averageCategories.html"));
app.get("/averageCourses", (req,res)=> res.sendFile(__dirname + "/pages/averageCourses.html"));



