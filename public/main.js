google.charts.load('current', {'packages':['corechart', 'line']});


document.getElementById("add-ticker-btn").addEventListener("click", ()=>{
    const ticker_inputs = document.getElementById("ticker-inputs")
    const new_ticker = document.createElement("input")
    new_ticker.setAttribute("type", "text")
    new_ticker.setAttribute("name", "ticker-symbol")
    new_ticker.setAttribute("placeholder", "Company Ticker")
    new_ticker.className = 'animated-input'
    ticker_inputs.appendChild(new_ticker)

    anime({
        targets: '.add-ticker',
        scale: [0.5, 1.10, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })


    anime({
        targets: '.animated-input',
        opacity: [0, 1],
        translateY: [-100, 0],
        duration: 1200,
        easing: 'easeOutExpo',
        complete: function(anim) {
            // Remove the class after animation
            anim.animatables.forEach(animatable => {
                animatable.target.classList.remove('animated-input');
            });
        }
    })
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
        create_symbol_selector("monte-carlo-sim-selector", "ticker-symbol")
        create_symbol_selector("save-company-data-selector", "ticker-symbol")
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

async function get_portfolio_data(){
    try{
        const response = await fetch("/api/portfolio-data", {
            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                portfolio_name: "My Portfolio"
            })
        })
        const data = await response.json()
        const portfolio_data = JSON.stringify(data.data)
        //console.log(portfolio_data)
        return portfolio_data

    } catch(error){
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
    //console.log(current_financial_data)

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



async function get_monte_symbol_data(){
    const company_selector = document.getElementById("monte-carlo-sim-selector")
    const selected_ticker = company_selector.options[company_selector.selectedIndex]
    const symbol = selected_ticker.value.toUpperCase()
    try{
        const response = await fetch("/api/monte-carlo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const financial_data = JSON.stringify(data)
        //console.log(financial_data)
        return financial_data
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}

async function get_VaR_portfolio(){
    try{
        const response = await fetch("/api/value-at-risk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: "ticker"
            })
        })
        const data = await response.json()
        const portfolio_obj = data['data']
        const symbol_arr = Object.keys(portfolio_obj)
        const str_portfolio_obj = JSON.stringify(portfolio_obj)
        const str_symbol_arr = JSON.stringify(symbol_arr)
        const input_div = document.getElementById("VaR-share-count-inputs")
        const var_btn_div = document.getElementById("VaR-btn-container")
        symbol_arr.map((symbol)=>{
            const html = `
            <p>Ticker: ${symbol}</p>
            <input type="number" name="VaR-ticker-shares" placeholder="Number of shares for ${symbol}">
            `;
            const inpt_child_div = document.createElement("div");
            inpt_child_div.innerHTML = html;
            input_div.appendChild(inpt_child_div)
        })
        var_btn_div.style.display = "block"
        //console.log(symbol_arr)
        return [str_portfolio_obj, str_symbol_arr]
    }
    catch(error){
        console.log(error)
        alert(`Unfortunately the following error has occurred: ${error}`);
    }
}


function get_share_counts(){
    const share_counts = document.getElementsByName("VaR-ticker-shares")
    const share_count_arr = []
    share_counts.forEach(count =>{
        //console.log(count.value)
        share_count_arr.push(count.value)
    })
    const final_arr = JSON.stringify(share_count_arr)
    return final_arr
}

async function save_all_financial_data(){
    try{
        const response = await fetch("/api/save-financial-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: "ticker"
            })
        })
    }
    catch(error){
        
    }
}

async function save_company_financial_data(){
    const company_selector = document.getElementById("save-company-data-selector")
    const selected_ticker = company_selector.options[company_selector.selectedIndex]
    const symbol = selected_ticker.value.toUpperCase()
    try{
        const response = await fetch("/api/save-company-financial-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticker_symbol: symbol
            })
        })
        const data = await response.json()
        const financials = data.financial_data
        const stock_info = data.stock_price_data
        const [balance_sheet, cash_flow, income, summary] = financials
        const balance_sheet_data = balance_sheet.balanceSheetStatements
        const income_statements = income.incomeStatementHistory
        const cash_flow_statements = cash_flow.cashflowStatements
        const format_balance_sheet_data = balance_sheet_data.map((sheet)=>{
            const sheet_object = {
                "Year Ended": [sheet.endDate],
                "Accounts Receivable": [sheet.netReceivables],
                "Cash": [sheet.cash],
                "Inventory": [sheet.inventory],
                "Short Term Investments": [sheet.shortTermInvestments],
                "Other Current Assets": [sheet.otherCurrentAssets],
                "Current Assets": [sheet.totalCurrentAssets],
                "Property, Plant & Equipment": [sheet.propertyPlantEquipment],
                "Investments": [sheet.longTermInvestments],
                "Tangible Assets": [sheet.netTangibleAssets],
                "Other Assets": [sheet.otherAssets],
                "Total Assets": [sheet.totalAssets],
                "Accounts Payable": [sheet.accountsPayable],
                "Short-term Debt": [sheet.shortLongTermDebt],
                "Other Current Liabilties": [sheet.otherCurrentLiab],
                "Total Current Liabilities": [sheet.totalCurrentLiabilities],
                "Long-term Debt": [sheet.longTermDebt],
                "Other Long-term Liabilities": [sheet.otherLiab],
                "Total Liabilities": [sheet.totalLiab],
                "Common Stock": [sheet.commonStock],
                "Treasury Stock": [sheet.treasuryStock],
                "Total Stockholder Equity": [sheet.totalStockholderEquity],
                "Other Stockholder Equity": [sheet.otherStockholderEquity],
                "Retained Earnings": [sheet.retainedEarnings]
            }
            return sheet_object
        })
        const format_income_statement_data = income_statements.map((statement)=>{
            const statment_object = {
                "Year Ended": [statement.endDate],
                "Revenue": [statement.totalRevenue],
                "COGS": [statement.costOfRevenue],
                "Gross Profit": [statement.grossProfit],
                "Research and Development": [statement.researchDevelopment ? statement.researchDevelopment : 0],
                "SGA": [statement.sellingGeneralAdministrative],
                "Other Operating Costs": [statement.otherOperatingExpenses ? statement.otherOperatingExpenses : 0],
                "Total Operating Costs": [statement.totalOperatingExpenses],
                "Other": [statement.otherItems ? statement.otherItems : 0],
                "Operating Income": [statement.operatingIncome],
                "Income Tax Expense": [statement.incomeTaxExpense],
                "EBIT": [statement.ebit],
                "Interest Expense": [statement.interestExpense],
                "Net Income": [statement.netIncome]
            }
            return statment_object
        })
        const format_cash_flow_data = cash_flow_statements.map((flow)=>{
            const cash_object = {
                "Year Ended": [flow.endDate],
                "Net Income": [flow.netIncome],
                "Change to Net Income": [flow.changeToNetincome],
                "Change In Cash": [flow.changeInCash],
                "Change to Inventory": [flow.changeToInventory],
                "Change to Accounts Receivable": [flow.changeToAccountReceivables],
                "Depreciation": [flow.depreciation],
                "Dividends Paid": [flow.dividendsPaid],
                "Change to Operating Activities": [flow.changeToOperatingActivities],
                "Total Cash From Operations": [flow.totalCashFromOperatingActivities],
                "Stock Repurchase": [flow.repurchaseOfStock],
                "Net Borrowing": [flow.netBorrowings],
                "Other Cash Flow From Financing Activities": [flow.otherCashflowsFromFinancingActivities],
                "Total Cash From Financing Activities": [flow.totalCashFromFinancingActivities],
                "Capital Expenditures": [flow.capitalExpenditures],
                "Investments": [flow.investments],
                "Other Investing Activities": [flow.otherCashflowsFromInvestingActivities],
                "Total Cash From Investing Activities": [flow.totalCashflowsFromInvestingActivities]
            }
            return cash_object
        })
        
        //
        const balance_sheet_ws_data = format_balance_sheet_data
        const income_statement_ws_data = format_income_statement_data
        const cash_flow_statement_ws_data = format_cash_flow_data

        const balance_sheet_ws = []
        const cash_sheet_ws = []
        const income_statement_ws = []
        const stock_price_ws = []
        balance_sheet_ws_data.map((obj)=>{
            for(const key in obj){
                balance_sheet_ws.push([key, ...obj[key]])
            }
        })
        income_statement_ws_data.map((obj)=>{
            for(const key in obj){
                income_statement_ws.push([key, ...obj[key]])
            }
        })
        cash_flow_statement_ws_data.map((obj)=>{
            for(const key in obj){
                cash_sheet_ws.push([key, ...obj[key]])
            }
        })
        const stock_info_data = stock_info.map((dataFrame)=>{
           const stock_prices_object = {
                "Date": [dataFrame.date],
                "Open": [dataFrame.open],
                "High": [dataFrame.high],
                "Low": [dataFrame.low],
                "Close": [dataFrame.close],
                "Adjusted Closing Price": [dataFrame.adjClose],
                "Volume": [dataFrame.volume]
           }
           return stock_prices_object
        })
        const stock_price_info_obj = stock_info_data
        stock_price_info_obj.map((obj)=>{
            for(const key in obj){
                stock_price_ws.push([key, ...obj[key]])
            }
        })
        console.log(stock_price_info_obj)
        const balance_sheet_xlsx = XLSX.utils.aoa_to_sheet(balance_sheet_ws)
        const income_sheet_xlsx = XLSX.utils.aoa_to_sheet(income_statement_ws)
        const cash_sheet_xlsx = XLSX.utils.aoa_to_sheet(cash_sheet_ws)
        const stock_prices_xlsx = XLSX.utils.aoa_to_sheet(stock_price_ws)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, balance_sheet_xlsx, "Balance Sheets")
        XLSX.utils.book_append_sheet(workbook, income_sheet_xlsx, "Income Statements")
        XLSX.utils.book_append_sheet(workbook, cash_sheet_xlsx, "Cash Flows")
        XLSX.utils.book_append_sheet(workbook, stock_prices_xlsx, "Stock Prices")
        XLSX.writeFile(workbook, `${symbol}-financials.xlsx`)
    }
    catch(error){
        console.log(error)
        
    }
}

document.getElementById("save-company-financial-data").addEventListener("click", ()=>{
    save_company_financial_data()
})

function openTab(pageName){
    var i, tabcontent;
    tabcontent = document.getElementsByClassName("main-section");
    const tabbuttons = document.querySelectorAll('.footer-btn')
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    document.getElementById(pageName).style.display = "block";
}

function footerEventListeners(parent, className){
    var children = parent.querySelectorAll(`.${className}`);
    for (var i = 0; i < children.length; i++) {
        children[i].addEventListener("click", function() {
            //console.log(this.dataset.pagename, this.dataset.colour)
            openTab(this.dataset.pagename);
        });
    
    }
}

document.getElementById("search-companies-btn").addEventListener("click", ()=>{
    anime({
        targets: '#search-companies-btn',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    }) 
    checkChildren("div-to-insert")
     
})

anime({
    targets: '.capm-breakdown p',
    opacity: [0, 1],
    translateY: [-100, 0],
    duration: 2000,
    easing: 'easeOutExpo',

})

document.getElementById("get-current-portfolio").addEventListener("click", ()=>{
    anime({
        targets: '#get-current-portfolio',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
    checkChildren("data-charts-portfolio")
})

document.getElementById("make-simple-pred-btn").addEventListener("click", ()=>{
    anime({
        targets: '#make-simple-pred-btn',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
    checkChildren("prediction-verdict")

})

document.getElementById("create-simple-model").addEventListener("click", ()=>{
    anime({
        targets: '#create-simple-model',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
    checkChildren("model-accuracy")
})

document.getElementById("save-company-financial-data").addEventListener("click", ()=>{
    anime({
        targets: '#save-company-financial-data',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
})

document.getElementById("get-company-financial-data").addEventListener("click", ()=>{
    anime({
        targets: '#get-company-financial-data',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
})

document.getElementById("run-monte-carlo").addEventListener("click", ()=>{
    anime({
        targets: '#run-monte-carlo',
        scale: [0.75, 1.05, 1],
        duration: 1000,
        backgroundColor: ['#000000', '#2F98E7'],
        easing: 'spring(1, 80, 10, 0)'
    })
    checkChildren("monte-chart-container")
})

anime({
    targets: '#mySvg',
    opacity: [0, 0.25, 0.5, 1],
    easing: 'easeInOutSine',
    duration: 1200,
    direction: 'alternate',
    loop: true,
    easing: 'spring(1, 80, 10, 0)'
});

function checkChildren(container){
    const divElement = document.getElementById(container);
    if (divElement.childElementCount !== 0) {
        document.querySelector('.loading-screen').style.display = 'none';
        document.querySelector('.main').style.display = 'block';
    }
    else{
        document.querySelector('.main').style.display = 'none';
        document.querySelector('.loading-screen').style.display = 'flex';
        setTimeout(function() {
            document.querySelector('.loading-screen').style.display = 'none';
            document.querySelector('.main').style.display = 'block';
        }, 15000);
    }

}


function longerCheckChildren(container){
    const divElement = document.getElementById(container);
    if (divElement.childElementCount !== 0) {
        document.querySelector('.loading-screen').style.display = 'none';
        document.querySelector('.main').style.display = 'block';
    }
    else{
        document.querySelector('.main').style.display = 'none';
        document.querySelector('.loading-screen').style.display = 'flex';
        setTimeout(function() {
            document.querySelector('.loading-screen').style.display = 'none';
            document.querySelector('.main').style.display = 'block';
        }, 32000);
    }

}

window.onload = function(){
    const footerEl = document.querySelector('footer');
    footerEventListeners(footerEl, "footer-btn")
    document.getElementById("defaultOpen").click();
    setTimeout(function() {
        document.querySelector('.loading-screen').style.display = 'none';
        document.querySelector('.main').style.display = 'block';
        anime({
        targets: '.main-card',
        opacity: [0, 1],
        translateY: [-200, 0],
        duration: 1600,
        easing: 'easeOutExpo',
    })
    }, 20500);
}

