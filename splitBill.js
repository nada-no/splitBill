var sb = {
    participants: [],
    addExpVw: null,
    joinVw: null,
    resultsVw: null,
    pplForm: null,
    amountInp: null,
    addExpBtn: null,
    toAddExp: null,

    //setup the app
    init: () => {
        sb.addExpVw = document.getElementById("addExpenseView");
        sb.resultsVw = document.getElementById("resultsView");
        sb.addExpVw.classList.add("hidden");
        sb.pplForm = document.getElementById("pplForm");
        sb.amountInp = document.getElementById("amount");
        sb.addExpBtn = document.getElementById("addExpBtn");
        sb.addExpBtn.onclick = sb.addExp;
        sb.toAddExp = document.getElementById("toAddExp");
        sb.toAddExp.onclick = sb.openAddExp;
        //UPDATE LISTENER new users & expenses
        window.webxdc.setUpdateListener(function (update) {
            if (update.payload.type === "addUser") {
                sb.participants.push({ name: update.payload.name, debts: [] });
                sb.list();
            } else if(update.payload.type === "expense") {
                //divide the expense between the people
                let amountPP = update.payload.amount/sb.participants.length;
                sb.participants.forEach((person)=>{
                    if(person.name != update.payload.payer) person.debts.push({payee: update.payload.payer, amount: amountPP});
                });
                sb.list();
            }
        });



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
        console.log(sb.participants);

    },

    //list debts and people
    list: () => {
        sb.pplForm.innerHTML = "";
        for (const person of sb.participants) {
            let label = document.createElement("p");
            let debt = 0;
            //calculate the amount of money every person owes
            person.debts.forEach(
                (dbt) => {
                    debt += dbt.amount;
                }
            );
            label.textContent = person.name + " owes " + debt + " in total.";
            sb.pplForm.appendChild(label);
        }
    },

    //add expense
    addExp: () => {
        let amount = Number.parseInt(sb.amountInp.value);
        let info = window.webxdc.selfName + " added a " + amount + "€ expense";
        //send an update
        window.webxdc.sendUpdate(
            {
                payload: {
                    payer: window.webxdc.selfName,
                    type: "expense",
                    amount: amount,
                    // participants: 
                },
                info
            },
            info
        );
    },

    //open add expense screen
    openAddExp: () => {
        sb.resultsVw.classList.add("hidden");
        sb.addExpVw.classList.remove("hidden");
    },


};
window.addEventListener("load", sb.init);
