const express = require('express');
const app = express();

app.get('/home', (req, res) => {
    //res.send('Hello, World!');
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/capm', (req, res) => {
    res.send('Hello, World!')
});

app.get('/my-html-file', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
