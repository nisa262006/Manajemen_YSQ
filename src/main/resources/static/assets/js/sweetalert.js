$("form[method='post']").on("submit", function () {
   blockUi()
})

$(".block-ui").on("click", function () {
   blockUi()
})

$(".delete-confirmation").on("click", function (event) {
    event.preventDefault();
    let link = $(this).prop("href")
    let msg = $(this).data("message")
    if(msg === undefined || msg === null){
        msg = "apakah anda yakin ingin menghapus data?"
    }
    createConfirmationAlert("Konfirmasi hapus",msg,link)
})

$(".popup-confirmation").on("click", function (event) {
    event.preventDefault();
    let link = $(this).prop("href")
    let title = $(this).data("title")
    let message = $(this).data("message")
    createConfirmationAlert(title,message,link)
})

$(".form-confirmation").on("click", function (event) {
    let title = $(this).data("title")
    let message = $(this).data("message")
    let form = $(this).data("form")
    createConfirmationAlertForm(title,message,form)
})

function blockUi() {
    Swal.fire({
        titleText: 'Please wait..',
        icon:'info',
        allowOutsideClick:false,
        allowEscapeKey:false,
        showConfirmButton:false
    })
}

function createAlert(title,icon,msg){
    return Swal.fire({
        titleText: title,
        icon:icon,
        text:msg
    })
}

function createConfirmationAlert(title,msg,link){
    Swal.fire({
        title: title,
        html: msg,
        icon: "warning",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton:true
    }).then((result) => {
        if (result.isConfirmed && link !== undefined) {
            Swal.fire(
                'Loading!',
                'Harap tunggu...',
                'info'
            )
            window.location.href = link;
        }
    })
}

function createConfirmationAlertForm(title,msg,form){
    let formElement = $(form)
    Swal.fire({
        title: title,
        html: msg,
        icon: "warning",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton:true
    }).then((result) => {
        if (result.isConfirmed && form !== undefined) {
            formElement.submit()
        }
    })
}