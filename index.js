const express = require('express');
const bodyParser = require('body-parser');
const yahooFinance = require('yahoo-finance2').default;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//parse JSON data
app.use(express.json())
app.use(express.static('public'));

const stock_ticker_data = {}
const company_financial_data = {}

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
        const query_options = { period1: '2005-01-01'}
        const risk_free_query_options = { period1: '2023-08-14', period2: '2023-08-15'}
        const beta_data_query_options = { modules: ['summaryDetail', 'balanceSheetHistoryQuarterly', 'cashflowStatementHistoryQuarterly', 'incomeStatementHistoryQuarterly', 'financialData'] };

        const risk_free_data = await yahooFinance.historical("^TNX", risk_free_query_options)
        const benchmark_result = await yahooFinance.historical(benchmark_ticker, query_options)

        benchmark_data[benchmark_ticker] = benchmark_result
        for(const symbol of ticker_symbols){
            //company_result.push(await yahooFinance.historical(symbol, query_options))
            const ticker_data = await yahooFinance.historical(symbol, query_options)
            stock_ticker_data[symbol] = ticker_data
            company_result[symbol] = ticker_data
        }

        for(const ticker of ticker_symbols){
            const financial_data = await yahooFinance.quoteSummary(ticker, beta_data_query_options)
            beta_result[ticker] = financial_data.summaryDetail.beta
            company_financial_data[ticker] = [financial_data.balanceSheetHistoryQuarterly, financial_data.cashflowStatementHistoryQuarterly, financial_data.financialData, financial_data.incomeStatementHistoryQuarterly]
        }
        res.status(200).json({benchmark_data, company_result, risk_free_data, beta_result})
    }
    catch(error){
        res.status(500).json({error: error.name, msg: error.message})
    }
});

app.post('/api/simple', async(req, res)=>{
    const {ticker_symbol} = req.body
    try{
        const data = stock_ticker_data[ticker_symbol]
        res.status(200).json({data})
    }
    catch(error){
        res.status(500).json({error: error.name, msg: error.message})
    }
})

app.post('/api/company-financials', async(req, res)=>{
    const {ticker_symbol} = req.body
    try{
        const data = company_financial_data[ticker_symbol]
        res.status(200).json({data})
    }
    catch(error){
        res.status(500).json({error: error.name, msg: error.message})
    }
})

app.get('/my-html-file', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
