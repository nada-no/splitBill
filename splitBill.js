var sb = {
    participants: [],
    addExpVw: null,
    resultsVw: null,
    homeVw: null,
    expListVw: null,
    closeExpVw: null,
    closeExpListVw: null,
    expList: null,
    conceptInp: null,
    amountInp: null,
    errorInp: null,
    addExpBtn: null,
    toAddExp: null,
    toExpList: null,
    results: null,
    debts: [],
    expenses: [],


    //setup the app
    init: () => {
        sb.homeVw = document.getElementById("home");
        sb.resultsVw = document.getElementById("resultsView");
        sb.addExpVw = document.getElementById("addExpenseView");
        sb.expListVw = document.getElementById("allExpensesView");
        sb.expList = document.getElementById("expensesList");
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.add("hidden");
        sb.expListVw.classList.add("hidden");
        sb.closeExpVw = document.getElementById("closeExpVw");
        sb.closeExpVw.onclick = sb.list;
        sb.closeExpListVw = document.getElementById("closeExpListVw");
        sb.closeExpListVw.onclick = sb.list;
        sb.amountInp = document.getElementById("amount");
        sb.conceptInp = document.getElementById("concept");
        sb.errorInp = document.getElementById("errorInp");
        sb.errorInp.classList.add("hidden");
        sb.addExpBtn = document.getElementById("addExpBtn");
        sb.addExpBtn.onclick = sb.addExp;
        sb.toAddExp = document.getElementById("toAddExp");
        sb.toAddExp.onclick = sb.openAddExp;
        sb.toExpList = document.getElementById("toExpList");
        sb.toExpList.onclick = sb.openExpList;
        sb.results = document.getElementById("results");

        //UPDATE LISTENER new users & expenses
        window.webxdc.setUpdateListener(function (update) {
            if (update.payload.type === "addUser") {
                sb.participants.push({ name: update.payload.name, debts: {}, paid: 0 });
            } else if (update.payload.type === "expense") {
                //store the expense
                sb.expenses.push({
                    concept: update.payload.concept,
                    amount: update.payload.amount,
                    participants: update.payload.payees
                });
                //divide the expense between the people
                let amountPP = update.payload.amount / sb.participants.length;
                amountPP = Number.parseFloat(amountPP.toFixed(2));
                let paidFor = {};
                update.payload.payees.forEach(element => {
                    paidFor[element] = amountPP;
                });
                sb.debts.push({
                    paidBy: update.payload.payer,
                    paidFor: paidFor,
                });
            }
            sb.list();
        });

        setTimeout(sb.addUser, 5000);
    },

    //list debts and people
    list: () => {
        //close the other views
        sb.hideAll();
        sb.resultsVw.classList.remove("hidden");

        //list debts
        sb.results.innerHTML = "";
        for (const person of sb.participants) {
            let labelContainer = document.createElement("div");
            let label = document.createElement("p");
            let debtsUl = document.createElement("ul");

            let debt = 0;
            let debts = simplifyDebts(sb.debts);

            //CALCULATING DEBTS
            debts.forEach(el => {
                if (el[0] === person.name) {
                    debt += el[2];
                    let li = document.createElement("li");
                    li.textContent = el[2].toFixed(2) + "€ to " + el[1];
                    debtsUl.appendChild(li);
                }
            });

            label.textContent = person.name + " owes " + debt.toFixed(2) + " in total.";
            labelContainer.appendChild(label);
            labelContainer.appendChild(debtsUl);
            sb.results.appendChild(labelContainer);
        }
    },

    addUser: () => {
        //join to the participants once you opened the app
        if (!sb.participants.some((element) => element.name === window.webxdc.selfName)) {
            let info = window.webxdc.selfName + " entered in the SplitBill group";
            window.webxdc.sendUpdate(
                {
                    payload: {
                        name: window.webxdc.selfName,
                        type: "addUser",
                    },
                    info,
                },
                info
            );
        }
        // console.log(sb.participants);
        if (sb.participants.length == 0) sb.list();
    },

    //add expense
    addExp: () => {
        //validate input
        let amount = Number.parseInt(sb.amountInp.value);
        let concept = sb.conceptInp.value;
        if (amount === "" || isNaN(amount)) {
            sb.errorInp.classList.remove("hidden");
            sb.errorInp.innerHTML = "Please enter a valid amount of money!";
        } else if (concept === "") {
            sb.errorInp.classList.remove("hidden");
            sb.errorInp.innerHTML = "Please enter a concept!";
        } else {
            sb.errorInp.classList.add("hidden");

            let info = window.webxdc.selfName + " added a " + amount + "€ expense";
            let payees = [];
            sb.participants.forEach(el => {
                if (el.name !== window.webxdc.selfName) payees.push(el.name);
            });
            //send an update
            window.webxdc.sendUpdate(
                {
                    payload: {
                        payer: window.webxdc.selfName,
                        type: "expense",
                        concept: concept,
                        amount: amount,
                        payees: payees,
                    },
                    info
                },
                info
            );
            sb.list();
        }
    },

    //open add expense screen
    openAddExp: () => {
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.remove("hidden");
        //show checkboxes of participants
        // TODO

    },

    //open and display exp list
    openExpList: () => {
        //display the view
        sb.hideAll();
        sb.expListVw.classList.remove("hidden");
        //list the expenses
        sb.expList.innerHTML = "";

        if (sb.expenses.length == 0) {
            let p = document.createElement("p");
                p.textContent = "There's no expenses yet";
                sb.expList.appendChild(p);
        } else {
            for (const exp of sb.expenses) {
                let p = document.createElement("p");
                p.textContent = exp.concept + " - " + exp.amount;
                sb.expList.appendChild(p);
            }
        }
    },

    //hide all views
    hideAll: () => {
        sb.homeVw.classList.add("hidden");
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.add("hidden");
        sb.expListVw.classList.add("hidden");
    },

};
window.addEventListener("load", sb.init);