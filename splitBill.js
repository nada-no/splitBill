var sb = {
    participants: [],
    addExpVw: null,
    resultsVw: null,
    homeVw: null,
    expListVw: null,
    closeExpVw: null,
    closeExpListVw: null,
    expList: null,
    partList: null,
    conceptInp: null,
    amountInp: null,
    particInp: null,
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
        sb.particInp = document.getElementById("particInp");
        sb.partList = document.getElementById("partList");
        sb.addExpBtn = document.getElementById("addExpBtn");
        sb.addExpBtn.onclick = sb.addExp;
        sb.toAddExp = document.getElementById("toAddExp");
        sb.toAddExp.onclick = sb.openAddExp;
        sb.toExpList = document.getElementById("toExpList");
        sb.toExpList.onclick = sb.openExpList;
        sb.results = document.getElementById("results");

        //UPDATE LISTENER new users & expenses
        window.webxdc.setUpdateListener(function (update) {
            if (update.payload.type === "addUser") { // USER ADDITION
                sb.participants.push({ name: update.payload.name, debts: {}, paid: 0 });
            } else if (update.payload.type === "expense") { // EXPENSE ADDITION
                //store the expense
                sb.expenses.push({
                    concept: update.payload.concept,
                    amount: update.payload.amount,
                    participants: update.payload.payees,
                    date: update.payload.date,
                });
                //divide the expense between the people
                let amountPP = update.payload.amount / sb.participants.length;
                amountPP = Number.parseFloat(amountPP.toFixed(2));
                let paidFor = {};
                update.payload.payees.forEach(element => {
                    paidFor[element] = amountPP;
                });
                sb.debts.push({
                    date: update.payload.date,
                    concept: update.payload.concept,
                    paidBy: update.payload.payer,
                    paidFor: paidFor,
                });
            } else if (update.payload.type == "deletion") { //  EXPENSE DELETION
                //delete expense
                let index = sb.expenses.findIndex((obj) => {
                    return obj.date === update.payload.date && obj.concept === update.payload.concept;
                });
                if (index != -1) sb.expenses.splice(index, 1);
                //delete debts
                index = sb.debts.findIndex((obj) => {
                    return obj.date === update.payload.date && obj.concept === update.payload.concept;
                });
                if (index != -1) sb.debts.splice(index, 1);
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
                        date: Date.now(),
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
        //clear the inputs and add animations
        sb.amountInp.value = "";
        sb.conceptInp.value = "";
        sb.amountInp.parentElement.classList.remove("focus", "float");
        sb.conceptInp.parentElement.classList.remove("focus", "float");

        sb.amountInp.onfocus = (ev) => {
            ev.currentTarget.parentElement.classList.add("focus", "float");
        };
        sb.conceptInp.onfocus = (ev) => {
            ev.currentTarget.parentElement.classList.add("focus", "float");
        };
        sb.amountInp.onblur = (ev) => {
            if (!sb.amountInp.value) {
                ev.currentTarget.parentElement.classList.remove("focus", "float");
            } else {
                ev.currentTarget.parentElement.classList.remove("focus");
            }
        };
        sb.conceptInp.onblur = (ev) => {
            if (sb.conceptInp.value == "") {
                ev.currentTarget.parentElement.classList.remove("focus", "float");
            } else {
                ev.currentTarget.parentElement.classList.remove("focus");
            }
        };

        //add the participants list
        for(const person of sb.participants) {
            let div = document.createElement("div");
            div.setAttribute("class","partListItem")
            let name = document.createElement("p");
            let check = document.createElement("input");

            name.textContent = person.name;
            div.appendChild(name);
            
            check.setAttribute("type","checkbox");
            check.setAttribute("checked", "true");
            div.appendChild(check);
            sb.partList.appendChild(div);
        }

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
                //create elements
                let expense = document.createElement("div");
                let div = document.createElement("div");
                let amt = document.createElement("p");
                let conc = document.createElement("p");
                let arrow = document.createElement("span");
                let date = document.createElement("p");
                let details = document.createElement("div");
                let deleteBtn = document.createElement("button");
                let confirmation = document.querySelector("#confirmation");
                let confYes = document.querySelector("#confYes");
                let confNo = document.querySelector("#confYes");
                let dateString = new Date(exp.date);
                let amount = exp.amount / exp.participants.length;


                //create the expense "header"
                div.classList.add("expense");
                details.classList.add("details");
                date.textContent = dateString.getDate() + "/" + dateString.getMonth() + "/" + dateString.getFullYear();
                conc.textContent = exp.concept;
                amt.textContent = exp.amount + "€";
                arrow.setAttribute("id-data", exp.date);
                arrow.innerHTML = "<svg id='i-chevron-bottom' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='20' height='20' fill='none' stroke='currentcolor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'><path d='M30 12 L16 24 2 12' /></svg>";
                arrow.onclick = (ev) => {
                    if (ev.currentTarget.parentElement.nextSibling.classList.contains("hidden")) {
                        ev.currentTarget.parentElement.nextSibling.classList.remove("hidden");
                        ev.currentTarget.innerHTML = '<svg id="i-chevron-top" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M30 20 L16 8 2 20" /></svg>'
                    } else {
                        ev.currentTarget.parentElement.nextSibling.classList.add("hidden");
                        arrow.innerHTML = "<svg id='i-chevron-bottom' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='20' height='20' fill='none' stroke='currentcolor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'><path d='M30 12 L16 24 2 12' /></svg>";
                    }

                };

                //append the details
                for (const part of exp.participants) {
                    let participant = document.createElement("p");
                    participant.textContent = part + " owes " + amount.toFixed(2) + "€";
                    details.appendChild(participant);
                }
                //append the buttons and the confirmation dialog
                deleteBtn.innerHTML = "Delete Expense";
                deleteBtn.onclick = () => {


                    window.webxdc.sendUpdate(
                        {
                            payload: {
                                deleter: window.webxdc.selfName,
                                type: "deletion",
                                concept: exp.concept,
                                amount: amount,
                                date: exp.date,
                            }

                        }

                    );
                };
                details.classList.add("m2");
                details.appendChild(deleteBtn);
                details.classList.add("hidden");


                //append all the elements
                div.appendChild(date);
                div.appendChild(conc);
                div.appendChild(amt);
                div.appendChild(arrow);
                expense.appendChild(div);
                expense.appendChild(details);

                sb.expList.appendChild(expense);
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