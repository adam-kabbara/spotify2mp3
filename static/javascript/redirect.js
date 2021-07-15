function redirect(url){

    elem = document.createElement('a');
    elem.href = url;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}