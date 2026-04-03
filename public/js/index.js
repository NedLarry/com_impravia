const formElement = document.getElementById("formSubmit");

formElement.addEventListener('click', handleSubmit)

function handleSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    if(email) 
    {
        alert("Thanks! We'll notify " + email);
        document.getElementById("email").value = "";

        fetch('/notify-save', {method: 'POST', headers:{'content-type': 'application/json'}, body: JSON.stringify({EmailAddress: email})})
        .then(response => {
            return response.json()
        })
        .then(result => console.log('response', result))
        .catch(error => console.log('error', error))
    }
}



