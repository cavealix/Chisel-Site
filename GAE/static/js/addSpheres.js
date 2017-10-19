// Add New Sphere Input ///////////////////////////////////////
function addInput(divName){

  var newdiv = document.createElement('div');
  newdiv.innerHTML = ' <input type="text" name="sphere_url" placeholder="sphere url">'+
            '<input type="text" name="embed_code" placeholder="embedcode">'+
        '<br>';
  document.getElementById(divName).appendChild(newdiv);
  
}