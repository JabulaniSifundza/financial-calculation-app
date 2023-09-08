google.charts.load('current', {'packages':['corechart', 'line']});


document.getElementById("add-ticker-btn").addEventListener("click", ()=>{
    const ticker_inputs = document.getElementById("ticker-inputs")
    const new_ticker = document.createElement("input")
    new_ticker.setAttribute("type", "text")
    new_ticker.setAttribute("name", "ticker-symbol")
    new_ticker.setAttribute("placeholder", "Ticker Symbol")
    ticker_inputs.appendChild(new_ticker)
})

function structure_data(){
    return calculate_capm()
}

function create_symbol_selector(selector_id, option_array){
    const ticker_symbols = document.getElementsByName(option_array)
    const selector = document.getElementById(selector_id)
    ticker_symbols.forEach(option =>{
        const option_html = `<option value=${option.value}>${option.value}</option>`
        const option_element = document.createElement('option')
        option_element.innerHTML = option_html
        selector.appendChild(option_element)
        return selector.outerHTML
    })
}

async function calculate_capm(){
    try{
        const ticker_symbols = document.getElementsByName("ticker-symbol")
        const benchmark_selector = document.getElementById("benchmark")
        const select_elem = document.getElementById("simple-model-ticker-selector")
        const ticker_symbols_list = []
        const selected_benchmark = benchmark_selector.options[benchmark_selector.selectedIndex].value
        ticker_symbols.forEach(ticker_symbol => {
            const upper = ticker_symbol.value.toUpperCase()
            ticker_symbols_list.push(upper)
            const symbol_option = `<option value=${ticker_symbol.value}>${ticker_symbol.value.toUpperCase()}</option>`
            const option_element = document.createElement('option')
            option_element.innerHTML = symbol_option
            select_elem.appendChild(option_element)
        })
        const response = await fetch("/api/capm", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbols: ticker_symbols_list,
                benchmark_ticker: selected_benchmark
            })
        })
        //console.log(ticker_symbols_list)
        const data = await response.json()
        //console.log(data)
        const company_data = data.company_result
        const benchmark_data = data.benchmark_data
        const risk_free_data = data.risk_free_data
        const company_beta_values = data.beta_result
        const stock_prices = JSON.stringify(company_data)
        const benchmark_prices = JSON.stringify(benchmark_data)
        const risk_free_rate = JSON.stringify(risk_free_data)
        const beta_data = JSON.stringify(company_beta_values)
        create_symbol_selector("company-financials-selector", "ticker-symbol")
        //console.log(beta_data)
        return [stock_prices, benchmark_prices, risk_free_rate, beta_data]
    }
    catch(error){
        console.log(error);
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}


function turner(){
    return "William Turner"
}

async function structure_simple_model_data(){
    const simple_model_ticker_selector = document.getElementById("simple-model-ticker-selector")
    const selected_ticker = simple_model_ticker_selector.options[simple_model_ticker_selector.selectedIndex]
    const symbol = selected_ticker.value.toUpperCase()
    try{
        const response = await fetch("/api/simple", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const symbol_data = data
        const price_data = JSON.stringify(symbol_data)
        //console.log(price_data)
        return price_data
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}

async function get_financial_data(){
    const company_selector = document.getElementById("company-financials-selector")
    const selected_ticker = company_selector.options[company_selector.selectedIndex]
    const symbol = selected_ticker.value.toUpperCase()
    try{
        const response = await fetch("/api/company-financials", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const financial_data = data
        //console.log(financial_data)
        return financial_data
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}

document.getElementById("get-company-financial-data").addEventListener("click", async()=>{
    const data = await get_financial_data()
    // Destructure financial document array
    const [balance_sheets, cash_flow_statements, income_statements, current_financial_data] = data['data']

    // Destructure balance sheet array
    const [fourth_year_balance_sheet, third_year_balance_sheet, second_year_balance_sheet, first_year_balance_sheet] = balance_sheets["balanceSheetStatements"]
    const [fourth_year_cash_flow_sheet, third_year_cash_flow_sheet, second_year_cash_flow_sheet, first_year_cash_flow_sheet] = cash_flow_statements["cashflowStatements"]
    const [fourth_year_income_statement_sheet, third_year_income_statement_sheet, second_year_income_statement_sheet, first_year_income_statement_sheet] = income_statements["incomeStatementHistory"]

    // Helper function to get dates
    function get_dates(obj){
        const [year,] = obj['endDate'].split("T")
        return year  
    }
    console.log(current_financial_data)

    // Calling functions for visualizations and summary
    drawCurrentAssetsPie()
    drawTotalLiablities()
    drawAssetsVSLiabilities()
    drawCashFlowAmountsLines()
    drawProfitabilityTrend()
    drawProfitToCostComparison()
    drawCostBreakdown()
    drawProfitBreakdown()

    // Chart functions
    function drawCurrentAssetsPie(){
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Current Asset')
        data.addColumn('number', 'Amount')
        data.addRows([
            ['Cash', fourth_year_balance_sheet['cash']],
            ['Inventory', fourth_year_balance_sheet['inventory']],
            ['Accounts Receivable', fourth_year_balance_sheet['netReceivables']],
            ['Short Term Investments', fourth_year_balance_sheet['shortTermInvestments']],
            ['Other', fourth_year_balance_sheet['otherCurrentAssets']]
        ])

        var options = {
            'title': `${get_dates(fourth_year_balance_sheet)} Current Asset Breakdown`,
            width: '100%',
            height: '100%',
            pieHole: 0.4,
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }
        var chart = new google.visualization.PieChart(document.getElementById('current-asset-breakdown'))
        chart.draw(data, options)
    }

    function drawTotalLiablities(){
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Liabilities')
        data.addColumn('number', 'Amount')
        data.addRows([
            ['Accounts Payable', fourth_year_balance_sheet['accountsPayable']],
            ['Long Term Debt', fourth_year_balance_sheet['longTermDebt']],
            ['Short Term Debt', fourth_year_balance_sheet['shortLongTermDebt']],
            ['Other Current Liabilities', fourth_year_balance_sheet['otherCurrentLiab']],
            ['Other', fourth_year_balance_sheet['otherLiab']]
        ])

        var options = {
            'title': `${get_dates(fourth_year_balance_sheet)} Total Liability Breakdown`,
            width: '100%',
            height: '100%',
            pieHole: 0.4,
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }
        var chart = new google.visualization.PieChart(document.getElementById('total-liability-breakdown'))
        chart.draw(data, options)
    }



    function drawAssetsVSLiabilities(){
        var data = google.visualization.arrayToDataTable([
            ['Year', 'Current Assets', 'Current Liabilities', 'Total Liabilities', 'Total Assets'],
            [get_dates(first_year_balance_sheet), first_year_balance_sheet["totalCurrentAssets"], first_year_balance_sheet["totalCurrentLiabilities"], first_year_balance_sheet["totalLiab"], first_year_balance_sheet["totalAssets"]],
            [get_dates(second_year_balance_sheet), second_year_balance_sheet["totalCurrentAssets"], second_year_balance_sheet["totalCurrentLiabilities"], second_year_balance_sheet["totalLiab"], second_year_balance_sheet["totalAssets"]],
            [get_dates(third_year_balance_sheet), third_year_balance_sheet["totalCurrentAssets"], third_year_balance_sheet["totalCurrentLiabilities"], third_year_balance_sheet["totalLiab"], third_year_balance_sheet["totalAssets"]],
            [get_dates(fourth_year_balance_sheet), fourth_year_balance_sheet["totalCurrentAssets"], fourth_year_balance_sheet["totalCurrentLiabilities"], fourth_year_balance_sheet["totalLiab"], fourth_year_balance_sheet["totalAssets"]]
        ])

        var options = {
            title: `Current Assets, Current Liabilities, Total Liabilities, and Total Assets from ${get_dates(first_year_balance_sheet)} to ${get_dates(fourth_year_balance_sheet)}`,
            hAxis: {title: 'Year',  titleTextStyle: {color: '#333'}},
            vAxis: {
                minValue: 0,
                format: 'short'
            },
            legend: { position: 'bottom' },
            width: '100%',
            height: '100%',
            chartArea:{height:'380'},
            seriesType: 'bars',
            series: {0: {type: 'line'}},
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }
        var chart = new google.visualization.ComboChart(document.getElementById('asset-liability-comparison'));
        chart.draw(data, options);

    }

    function drawCashFlowAmountsLines(){
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Year');
        data.addColumn('number', 'Cash Flow From Operations');
        data.addColumn('number', 'Cash Flow From Investing Activities');
        data.addColumn('number', 'Cash Flow From Financing Activities');

        data.addRows([
            [get_dates(first_year_cash_flow_sheet), first_year_cash_flow_sheet['totalCashFromOperatingActivities'], first_year_cash_flow_sheet['totalCashflowsFromInvestingActivities'], first_year_cash_flow_sheet['totalCashFromFinancingActivities']],
            [get_dates(second_year_cash_flow_sheet), second_year_cash_flow_sheet['totalCashFromOperatingActivities'], second_year_cash_flow_sheet['totalCashflowsFromInvestingActivities'], second_year_cash_flow_sheet['totalCashFromFinancingActivities']],
            [get_dates(third_year_cash_flow_sheet), third_year_cash_flow_sheet['totalCashFromOperatingActivities'], third_year_cash_flow_sheet['totalCashflowsFromInvestingActivities'], third_year_cash_flow_sheet['totalCashFromFinancingActivities']],
            [get_dates(fourth_year_cash_flow_sheet), fourth_year_cash_flow_sheet['totalCashFromOperatingActivities'], fourth_year_cash_flow_sheet['totalCashflowsFromInvestingActivities'], fourth_year_cash_flow_sheet['totalCashFromFinancingActivities']]
        ])

        var options = {
            title: `Cash Flows from ${get_dates(first_year_cash_flow_sheet)} to ${get_dates(fourth_year_cash_flow_sheet)}`,
            curveType: 'function',
            width: '100%',
            height: '100%',
            seriesType: 'bars',
            series: {0: {type: 'line'}},
            vAxis:{
                format: 'short',
            },
            hAxis:{
                gridlines: {color: '#333', minSpacing: 20}
            },
            legend: { position: 'bottom' },
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }

        var chart = new google.visualization.ComboChart(document.getElementById('cash-flow-total-line'));
        chart.draw(data, options);
    }

    function drawProfitabilityTrend(){
         var data = google.visualization.arrayToDataTable([
            ["Year", "EBIT", "Operating Costs"],
            [get_dates(first_year_income_statement_sheet), first_year_income_statement_sheet["ebit"], first_year_income_statement_sheet["totalOperatingExpenses"]],
            [get_dates(second_year_income_statement_sheet), second_year_income_statement_sheet["ebit"], second_year_income_statement_sheet["totalOperatingExpenses"]],
            [get_dates(third_year_income_statement_sheet), third_year_income_statement_sheet["ebit"], third_year_income_statement_sheet["totalOperatingExpenses"]],
            [get_dates(fourth_year_income_statement_sheet), fourth_year_income_statement_sheet["ebit"], fourth_year_income_statement_sheet["totalOperatingExpenses"]]
        ])
        var options = {
            title: `Operating Costs and EBIT from ${get_dates(first_year_income_statement_sheet)} to ${get_dates(fourth_year_income_statement_sheet)}`,
            hAxis: {title: 'Year',  titleTextStyle: {color: '#333'}},
            vAxis: {
                minValue: 0,
                format: 'short'
            },
            legend: { position: 'bottom' },
            width: '100%',
            height: '100%',
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }
        var chart = new google.visualization.AreaChart(document.getElementById('income-operatingCost-comparison'));
        chart.draw(data, options);
    }

    function drawProfitToCostComparison(){
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Year');
        data.addColumn('number', 'Net Income');
        data.addColumn('number', 'Gross Income');
        data.addColumn('number', 'Operating Expenses');
        data.addColumn('number', 'Cost of Goods Sold');

        data.addRows([
            [get_dates(first_year_income_statement_sheet), first_year_income_statement_sheet["netIncome"], first_year_income_statement_sheet["grossProfit"], first_year_income_statement_sheet["totalOperatingExpenses"], first_year_income_statement_sheet["costOfRevenue"]],
            [get_dates(second_year_income_statement_sheet), second_year_income_statement_sheet["netIncome"], second_year_income_statement_sheet["grossProfit"], second_year_income_statement_sheet["totalOperatingExpenses"], second_year_income_statement_sheet["costOfRevenue"]],
            [get_dates(third_year_income_statement_sheet), third_year_income_statement_sheet["netIncome"], third_year_income_statement_sheet["grossProfit"], third_year_income_statement_sheet["totalOperatingExpenses"], third_year_income_statement_sheet["costOfRevenue"]],
            [get_dates(fourth_year_income_statement_sheet), fourth_year_income_statement_sheet["netIncome"], fourth_year_income_statement_sheet["grossProfit"], fourth_year_income_statement_sheet["totalOperatingExpenses"], fourth_year_income_statement_sheet["costOfRevenue"]]
        ])

        var options = {
            title: `Net Income, Gross Income, Operating Expenses, and Cost of Goods Sold from ${get_dates(first_year_income_statement_sheet)} to ${get_dates(fourth_year_income_statement_sheet)}`,
            curveType: 'function',
            width: '100%',
            height: '100%',
            seriesType: 'bars',
            series: {0: {type: 'line'}},
            vAxis:{
                format: 'short',
            },
            hAxis:{
                gridlines: {color: '#333', minSpacing: 20}
            },
            legend: { position: 'bottom' },
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }

        var chart = new google.visualization.ComboChart(document.getElementById('profitability-line'));
        chart.draw(data, options);

    }

    function drawCostBreakdown(){
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Operating Costs')
        data.addColumn('number', 'Amount')
        data.addRows([
            ['R&D', fourth_year_income_statement_sheet['researchDevelopment']],
            ['Selling, General & Administrative', fourth_year_income_statement_sheet['sellingGeneralAdministrative']],
            ['Other Operating Expenses', fourth_year_income_statement_sheet['otherOperatingExpenses']]
        ])

        var options = {
            'title': `${get_dates(fourth_year_income_statement_sheet)} Operating Cost Breakdown`,
            width: '100%',
            height: '100%',
            pieHole: 0.4,
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }

        }
        var chart = new google.visualization.PieChart(document.getElementById('operating-cost-breakdown'))
        chart.draw(data, options)
        
    }

    function drawProfitBreakdown(){
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Income')
        data.addColumn('number', 'Amount')
        data.addRows([
            ['Net Income', fourth_year_income_statement_sheet['netIncome']],
            ['Gross Profit', fourth_year_income_statement_sheet['grossProfit']],
            ['Operating Income', fourth_year_income_statement_sheet['ebit']],
        ])

        var options = {
        'title': `${get_dates(fourth_year_balance_sheet)} Income Breakdown`,
            width: '100%',
            height: '100%',
            pieHole: 0.4,
            colors: ["#004083", "#AC0202", "#107E7D", "#F7B801", "#6CC551"],
            animation:{
                "startup": true,
                duration: 1500,
                easing: 'out',
            }
        }
        var chart = new google.visualization.PieChart(document.getElementById('revenue-breakdown'))
        chart.draw(data, options)

    }


    // Summary Financials
    const summarize_financials = ()=>{
        const inner = `
            <h3></h3>
        `
    }
})