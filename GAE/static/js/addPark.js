var next = 1;
var select = '<select><option>Park</option><option>Bathroom</option><option>Water</option><option>View</option><option>Campsite</option></select>';
$(".add-more").click(function(e){
    e.preventDefault();
    var addto = "#field" + next;
    var addRemove = "#field" + (next);
    next = next + 1;
    var newIn = select + '<input autocomplete="off" class="input form-control" id="lat' + next + '" name="lat' + next + '" type="text"><input autocomplete="off" class="input form-control" id="lon' + next + '" name="lon' + next + '" type="text">';
    var newInput = $(newIn);
    var removeBtn = '<button id="remove' + (next - 1) + '" class="btn btn-danger remove-me" >-</button></div><div id="field">';
    var removeButton = $(removeBtn);
    $(addto).after(newInput);
    $(addRemove).after(removeButton);
    $("#lat" + next).attr('data-source',$(addto).attr('data-source'));
    $("#lon" + next).attr('data-source',$(addto).attr('data-source'));
    $("#count").val(next);  
    
    $('.remove-me').click(function(e){
        e.preventDefault();
        var fieldNum = this.id.charAt(this.id.length-1);
        var fieldID = "#field" + fieldNum;
        $(this).remove();
        $(fieldID).remove();
    });
});