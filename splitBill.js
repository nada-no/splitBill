var sb = {
    participants: [],
    addExpVw: null,
    resultsVw: null,
    homeVw: null,
    conceptInp: null,
    amountInp: null,
    errorInp: null,
    addExpBtn: null,
    toAddExp: null,
    closeExpVw: null,
    results: null,

    //setup the app
    init: () => {
        sb.homeVw = document.getElementById("home");
        sb.resultsVw = document.getElementById("resultsView");
        sb.addExpVw = document.getElementById("addExpenseView");
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.add("hidden");
        sb.amountInp = document.getElementById("amount");
        sb.conceptInp = document.getElementById("concept");
        sb.errorInp = document.getElementById("errorInp");
        sb.errorInp.classList.add("hidden");
        sb.addExpBtn = document.getElementById("addExpBtn");
        sb.addExpBtn.onclick = sb.addExp;
        sb.toAddExp = document.getElementById("toAddExp");
        sb.toAddExp.onclick = sb.openAddExp;
        sb.closeExpVw = document.getElementById("closeExpVw");
        sb.closeExpVw.onclick = sb.list;
        sb.results = document.getElementById("results");

        //UPDATE LISTENER new users & expenses
        window.webxdc.setUpdateListener(function (update) {
            if (update.payload.type === "addUser") {
                sb.participants.push({ name: update.payload.name, debts: [] });
            } else if (update.payload.type === "expense") {
                //divide the expense between the people
                let amountPP = update.payload.amount / sb.participants.length;
                sb.participants.forEach((person) => {
                    if (person.name != update.payload.payer) person.debts.push({ payee: update.payload.payer, amount: amountPP });
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
            let debt = 0;
            //calculate the amount of money every person owes
            person.debts.forEach(
                (dbt) => {
                    debt += dbt.amount;
                }
            );
            label.textContent = person.name + " owes " + debt + " in total.";
            labelContainer.appendChild(label);
            labelContainer.setAttribute("id-data", person.name);
            labelContainer.addEventListener("click", (el) => {
                sb.showDebts(el.currentTarget.getAttribute("id-data"));
            });
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
            //send an update
            window.webxdc.sendUpdate(
                {
                    payload: {
                        payer: window.webxdc.selfName,
                        type: "expense",
                        concept: concept,
                        amount: amount,
                        // participants: 
                    },
                    info
                },
                info
            );
            sb.list();
        }
    },

    //show a user's debts
    showDebts: (name) => {
        //get the debts
        let payees = [];
        let totalDebt = 0;
        let container = document.querySelector(`[id-data="${name}"]`);
        const { debts } = sb.participants.find((el) => {
            return el.name === name;
        });

        for (const debt of debts) {
            if (!payees.includes(debt.payee)) payees.push(debt.payee);
        }

        for(const person of payees) {
            debts.forEach((el)=>{
                if(el.payee === person) totalDebt += el.amount;
            });
            let payee = document.createElement("p");
            payee.textContent = "\t" + totalDebt + "€ to " + person;
            container.appendChild(payee);
        }
    },

    //open add expense screen
    openAddExp: () => {
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.remove("hidden");
    },

    //hide all views
    hideAll: () => {
        sb.homeVw.classList.add("hidden");
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.add("hidden");
    },

};
window.addEventListener("load", sb.init);