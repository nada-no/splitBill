var sb = {
    participants: [],
    payees: [],
    addExpVw: null,
    resultsVw: null,
    homeVw: null,
    settleUpVw: null,
    expListVw: null,
    closeExpVw: null,
    closeExpListVw: null,
    closeSettleUpVw: null,
    expList: null,
    partList: null,
    settleUpList: null,
    conceptInp: null,
    amountInp: null,
    particInp: null,
    errorInp: null,
    addExpBtn: null,
    toAddExp: null,
    toExpList: null,
    toSetUp: null,
    results: null,
    debts: [],
    expenses: [],
    searchHelper: {},


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
        sb.closeSettleUpVw = document.getElementById("closeSettleUpVw");
        sb.closeSettleUpVw.onclick = sb.list;
        sb.settleUpVw = document.getElementById("settleUpView");
        sb.settleUpVw.classList.add("hidden");
        sb.settleUpList = document.getElementById("settleUpList");
        sb.amountInp = document.getElementById("amount");
        sb.conceptInp = document.getElementById("concept");
        sb.errorInp = document.getElementById("errorInp");
        sb.errorInp.classList.add("hidden");
        sb.particInp = document.getElementById("particInp");
        // sb.particInp.onclick = () => {
        //     sb.partList.classList.contains("hidden") ? sb.partList.classList.remove("hidden") : sb.partList.classList.add("hidden");
        // };
        sb.partList = document.getElementById("partList");
        sb.addExpBtn = document.getElementById("addExpBtn");
        sb.addExpBtn.onclick = sb.addExp;
        sb.toAddExp = document.getElementById("toAddExp");
        sb.toAddExp.onclick = sb.openAddExp;
        sb.toSetUp = document.getElementById("toSetUp");
        sb.toSetUp.onclick = sb.settleUp;
        sb.toExpList = document.getElementById("toExpList");
        sb.toExpList.onclick = sb.openExpList;
        sb.results = document.getElementById("results");

        //UPDATE LISTENER new users & expenses
        window.webxdc.setUpdateListener(function (update) {
            if (update.payload.type === "addUser") { // USER ADDITION
                sb.participants.push({ name: update.payload.name, debts: {}, paid: 0 });
            } else if (update.payload.type === "expense") { // EXPENSE ADDITION
                //store the expense
                sb.expenses.unshift({
                    payer: update.payload.payer,
                    concept: update.payload.concept,
                    amount: update.payload.amount,
                    participants: update.payload.payees,
                    date: update.payload.date,
                    settle: update.payload.settle
                });
                //divide the expense between the people
                let amountPP;
                //check if it is a settle up or a regular expense
                update.payload.settle ? amountPP = update.payload.amount : amountPP = update.payload.amount / (update.payload.payees.length + 1);
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
                //delete expense (crossed out text)
                let index = sb.expenses.findIndex((obj) => {
                    return obj.date === update.payload.date && obj.concept === update.payload.concept;
                });
                if (index != -1) sb.expenses[index].del = update.payload.user;
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
        sb.results.innerHTML = "";

        //get debts 
        let debts = simplifyDebts(sb.debts);

        //show user's balance
        let balance = document.createElement("h2");
        let bNum = 0;
        debts.forEach(el => {
            if (el[0] === window.webxdc.selfName) {
                bNum -= el[2];
            }
            if (el[1] === window.webxdc.selfName) {
                bNum += el[2];
            }
        });
        if (bNum > 0) {
            balance.innerHTML = "You are owed <span class='green'>" + bNum.toFixed(2) + "</span>€";
        } else {
            balance.innerHTML = "You owe <span class='red'>" + (bNum * -1).toFixed(2) + "</span>€";
        }
        sb.results.appendChild(balance);


        //list debts
        for (const person of sb.participants) {
            let labelContainer = document.createElement("div");
            let label = document.createElement("p");
            let debtsUl = document.createElement("ul");
            let debt = 0;

            //CALCULATING DEBTS
            debts.forEach(el => {
                if (el[0] === person.name) {
                    debt += el[2];
                    let li = document.createElement("li");
                    li.textContent = el[2].toFixed(2) + "€ to " + el[1];
                    if (el[2] != 0) debtsUl.appendChild(li); //do not append the li element if there's no debts
                }
            });

            label.textContent = person.name + " owes " + debt.toFixed(2) + " in total.";
            if (debt != 0) labelContainer.appendChild(label); //do not append the person if he has no debts
            labelContainer.appendChild(debtsUl);
            sb.results.appendChild(labelContainer);

            //in case there's only 1 person show a message you need at least 2
            if (sb.participants.length < 2) {
                let label = document.createElement("p");
                label.textContent = "Waiting for at least 1 more person to join...";
                sb.results.appendChild(label);
                sb.toAddExp.classList.add("hidden");
            } else {
                sb.toAddExp.classList.remove("hidden");
            }
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
        let amount = sb.amountInp.value.trim();
        let concept = sb.conceptInp.value.trim();

        if (!/^\d+((\.|,)\d+)*$/.test(amount) || Number.parseFloat(amount.replace(/,/g, '.')) <= 0) {
            sb.errorInp.classList.remove("hidden");
            sb.errorInp.innerHTML = "Please enter a valid amount of money!";
        } else if (concept === "") {
            sb.errorInp.classList.remove("hidden");
            sb.errorInp.innerHTML = "Please enter a concept!";
        } else {
            sb.errorInp.classList.add("hidden");

            amount = amount.replace(/,/g, '.'); //transform commas in '.'
            amount = Number.parseFloat(amount);

            let info = window.webxdc.selfName + " added a " + amount + "€ expense: " + concept;
            let payees = [];
            //split between everybody or only some people?
            if (sb.particInp.checked) {
                sb.participants.forEach(el => {
                    if (el.name !== window.webxdc.selfName) payees.push(el.name);
                });
            } else {
                sb.payees.forEach(el => {
                    if (el.checked) payees.push(el.value);
                });
                if (payees.length === 0) {
                    sb.errorInp.classList.remove("hidden");
                    sb.errorInp.innerHTML = "Please select at least 1 payer";
                    return false;
                }
            }
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
                        settle: false
                    },
                    info
                },
                info
            );
            sb.list();
        }
    },

    //delete expense
    deleteExp: () => {
        let info = window.webxdc.selfName + ' deleted the expense "' + sb.searchHelper.concept + '"';
        window.webxdc.sendUpdate(
            {
                payload: {
                    user: window.webxdc.selfName,
                    date: Number.parseInt(sb.searchHelper.date),
                    type: "deletion",
                    concept: sb.searchHelper.concept,
                },
                info
            },
            info
        );
        sb.list();

        //reset searchHelper
        sb.searchHelper = {};
    },

    //settle up and remove all your debts
    settleUp: () => {
        //display the view
        sb.hideAll();
        sb.settleUpVw.classList.remove("hidden");
        sb.settleUpList.innerHTML = "";

        //get the debts
        let debts = simplifyDebts(sb.debts);

        //create and append the buttons
        debts.forEach(el => {
            if (el[1] === window.webxdc.selfName) {
                let button = document.createElement("button");
                button.classList.add("btnSmall");
                button.textContent = el[0];
                button.onclick = () => {
                    let info = window.webxdc.selfName + " settled up with " + el[0];
                    //send an update
                    window.webxdc.sendUpdate(
                        {
                            payload: {
                                payer: el[0],
                                type: "expense",
                                settle: true,
                                concept: info,
                                amount: el[2],
                                payees: [window.webxdc.selfName],
                                date: Date.now(),
                            },
                            info
                        },
                        info
                    );
                    sb.list();
                };
                sb.settleUpList.appendChild(button);
                let debtAdvice = document.createElement("p");
                debtAdvice.classList.add("inlineB");
                debtAdvice.textContent = "owes you " + el[2].toFixed(2) + "€";
                sb.settleUpList.appendChild(debtAdvice);
                sb.settleUpList.appendChild(document.createElement("br"));
            }
        });

        //append the hint paragraph
        let hint = document.getElementById("hintSettleUp");
        if (sb.settleUpList.innerHTML === "") {
            hint.innerText = "There's no one to settle up with. You can only settle up when somebody owes you money";
        } else {
            hint.innerText = "Select a user to settle up";
        }
    },

    //open add expense screen
    openAddExp: () => {
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.remove("hidden");
        sb.errorInp.classList.add("hidden");
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
        sb.payees = [];
        sb.partList.innerHTML = "";
        let msg = document.getElementById("particInpMsg");
        sb.particInp.checked = false;


        for (const person of sb.participants) {
            if (person.name === window.webxdc.selfName) continue;
            let div = document.createElement("div");
            div.setAttribute("class", "partListItem")
            let name = document.createElement("p");
            let check = document.createElement("input");

            name.textContent = person.name;

            check.setAttribute("type", "checkbox");
            check.setAttribute("value", person.name);
            check.onchange = (el) => {
                if (!el.checked) {
                    sb.particInp.checked = false;
                    msg.textContent = "Please select who pays";
                }
            };
            sb.payees.push(check); //add to the payees array to check if checked in the future
            div.appendChild(check);
            div.appendChild(name);

            sb.partList.appendChild(div);
        }
        //everyone not selected by default
        sb.payees.forEach((el) => {
            el.checked = false;
        });

        // sb.particInp.checked = false;
        sb.particInp.onchange = () => {
            if (sb.particInp.checked) {
                msg.textContent = "Everyone selected";
                sb.errorInp.classList.add("hidden");
                sb.payees.forEach((el) => {
                    el.checked = true;
                });
            } else {
                msg.textContent = "Please select who pays";
                // sb.errorInp.classList.add("hidden");
                sb.payees.forEach((el) => {
                    el.checked = false;
                });
            }
        };
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
                let payer = document.createElement("p");
                let div = document.createElement("div");
                let amt = document.createElement("p");
                let conc = document.createElement("p");
                let arrow = document.createElement("span");
                let date = document.createElement("p");
                let details = document.createElement("div");
                let deleteBtn = document.createElement("button");
                let confirmation = document.querySelector("#confirmation");
                let confYes = document.querySelector("#confYes");
                let confNo = document.querySelector("#confNo");
                let dateString = new Date(exp.date);
                let amount = exp.amount / (exp.participants.length + 1);


                //create the expense "header"
                div.classList.add("expense");
                details.classList.add("details");
                //check if the expense is deleted
                if (exp.del) {
                    date.innerHTML = "<del>" + dateString.getDate() + "/" + dateString.getMonth() + "/" + dateString.getFullYear()%100 + "</del>";
                    conc.innerHTML = "<del>" + exp.concept + "</del>";
                    amt.innerHTML = "<del>" + exp.amount.toFixed(2) + "€</del>";
                } else {
                    date.textContent = dateString.getDate() + "/" + dateString.getMonth() + "/" + dateString.getFullYear()%100;
                    conc.textContent = exp.concept;
                    amt.textContent = exp.amount.toFixed(2) + "€";
                }
                // arrow.setAttribute("id-data", exp.date);
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

                if (!exp.settle) {
                    //append the payer to the details
                    payer.textContent = exp.payer + " payed " + exp.amount.toFixed(2) + "€";
                    details.appendChild(payer);
                    //then append the payees to the details
                    for (const part of exp.participants) {
                        let participant = document.createElement("p");
                        participant.textContent = part + " owes " + amount.toFixed(2) + "€ to " + exp.payer;
                        details.appendChild(participant);
                    }
                } else {
                    //append the payer to the details
                    payer.textContent = exp.payer + " payed " + exp.amount.toFixed(2) + "€ to " + exp.participants[0];
                    details.appendChild(payer);
                }
                //append the buttons and the confirmation dialog
                deleteBtn.innerHTML = "Delete Expense";
                deleteBtn.setAttribute("id-data", exp.date);
                deleteBtn.setAttribute("concept", exp.concept);
                deleteBtn.onclick = (event) => {
                    sb.searchHelper.date = event.target.getAttribute("id-data");
                    sb.searchHelper.concept = event.target.getAttribute("concept");
                    sb.hideAll();
                    confirmation.classList.remove("hidden");
                };
                // confirmation button
                confYes.onclick = () => {
                    sb.deleteExp();
                    confirmation.classList.add("hidden");
                };
                //cancel button
                confNo.onclick = () => {
                    confirmation.classList.add("hidden");
                    sb.openExpList();
                    sb.searchHelper = {};
                };
                details.classList.add("m2");
                //if the expense is not deleted append delete button
                if (!exp.del) {
                    details.appendChild(deleteBtn);
                } else {
                    let deleter = document.createElement("p");
                    deleter.textContent = "This expense was deleted by " + exp.del;
                    deleter.classList.add("error");
                    details.appendChild(deleter);
                }
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
        sb.settleUpVw.classList.add("hidden");
    },

};
window.addEventListener("load", sb.init);