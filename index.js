const express = require('express');
const bodyParser = require('body-parser');
const yahooFinance = require('yahoo-finance2').default;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//parse JSON data
app.use(express.json())
app.use(express.static('public'));

app.get('/home', (req, res) => {
    //res.send('Hello, World!');
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/capm', async(req, res) => {
    const {ticker_symbols, benchmark_ticker} = req.body;
    try{
        const company_result = {}
        const benchmark_data = {}
        const beta_result = {}
        const query_options = { period1: '2018-02-01', period2: '2023-02-01'}
        const risk_free_query_options = { period1: '2023-08-14', period2: '2023-08-15'}
        const beta_data_query_options = { modules: ['summaryDetail'] };

        const risk_free_data = await yahooFinance.historical("^TNX", risk_free_query_options)
        const benchmark_result = await yahooFinance.historical(benchmark_ticker, query_options)

        benchmark_data[benchmark_ticker] = benchmark_result
        for(const symbol of ticker_symbols){
            //company_result.push(await yahooFinance.historical(symbol, query_options))
            const ticker_data = await yahooFinance.historical(symbol, query_options)
            company_result[symbol] = ticker_data
        }

        for(const ticker of ticker_symbols){
            const beta_value = await yahooFinance.quoteSummary(ticker, beta_data_query_options)
            beta_result[ticker] = beta_value.summaryDetail.beta
        }
        res.status(200).json({benchmark_data, company_result, risk_free_data, beta_result})
    }
    catch(error){
        res.status(500).json({error: error.name, msg: error.message})
    }
});

app.get('/my-html-file', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
