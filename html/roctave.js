var popupStatus = 0; 
var url="";
var ID="";
var cgidir="/cgi-bin/roctave/";
var infocgi=cgidir+"info.cgi";
var abortcgi=cgidir+"abort.cgi";
var spawncgi=cgidir+"spawn.cgi";
var lockcgi=cgidir+"lock.cgi";
var datadir="/roctave/";
var myCodeMirror;
var executing=0;
var locked=0;

//Things to do on startup
function roctave() {
StartSession();
SessionRefresh();
Refresh();

//When user clicks on little plus sign, toggle session/startup screens to alternate
$("div.expandmain").click(function(){
 $("div.main").toggle("slow");
 $("div#expandmainp").toggle();
 $("div#expandmainm").toggle();
});

//Start codemirror if not on admin page
var myTextArea=$("#input").get()[0];
if(window.location.href.indexOf('admin.html')<0) 
 {
  myCodeMirror = CodeMirror.fromTextArea(myTextArea,{tabMode: "indent", matchBrackets: true, onKeyEvent: function(editor, e) {
     //If user does shift+enter, submit command
     if(e.shiftKey && e.keyCode == 13 && e.type=='keydown')
       {
       e.preventDefault();
       $("#input").val(myCodeMirror.getValue());
       ReadySubmit('submit');
       return false;
       }
      }
     });
 //Check input field every 1000ms for changes and update highlighting
 setInterval("PreProcess(myCodeMirror.getValue())",1000);
 }

/*
$("#resizediv").resizable({
handles: 'sw',
minHeight: 100,
resize: function(){
//$('.CodeMirror-wrapping > iframe').height($(this).height());
$('#input').css({height:$(this).height()});
$('#resizeframe').height($(this).height());
}
});
*/

//Dropdown history where mouse is clicked and don't close until clicked again or X clicked
$("#histdroplink").click(function(event){
event.preventDefault();
$("#histdrop").toggle("fast");
$("#histdrop").css({"position":"fixed","left":event.pageX+10,"top":event.pageY+10});
return false;
});

$("#histclose").click(function(){
$("#histdrop").toggle("fast");
});

//Dropdown list of key shortcuts until clicked again or mouse leaves area
$("#keydroplink").click(function(event){
event.preventDefault();
$("#keydrop").toggle("fast");
$("#keydrop").css({"position":"fixed","left":event.pageX+10,"top":event.pageY+10});
return false;
});

$("#keydrop").mouseleave(function(){
$("#keydrop").hide("fast");
});

$("#keyclose").click(function(){
$("#keydrop").toggle("fast");
});

//Dropdown previous figures until clicked again
$("#prevfigdroplink").click(function(event){
event.preventDefault();
$("#prevfigdrop").toggle("fast");
$("#prevfigdrop").css({"position":"fixed","left":event.pageX+10,"top":event.pageY+10});
return false;
});

$("#prevfigclose").click(function(){
$("#prevfigdrop").toggle("fast");
});

//Drop down special commands until clicked again or mouse leaves area
$("#dropper").click(function() {
$(this).parent().find("ul.dropmenu").slideDown('fast').show();

$(this).parent().find("ul.dropmenu").hover(function(){},function(){
$(this).parent().find("ul.dropmenu").slideUp('slow');
});

});


//Abort submission on a ctrl+c
$(document).keydown(function(e) {
if(e.ctrlKey && e.keyCode==67 && e.type=='keydown' && executing==1)
 $.get(abortcgi, { path: ID});
});




} //End roctave()

function SessionRefresh() {
 //Get ID from global url
 if(url.length>1)
  {
  ID=url.replace(/.*\/([\d\.]+-\w+--\w+)\.fcgi/,"$1");
  }
 
  $("div.run").css("display","inline");
  $("div.main").css("display","none");
  $("div#expandmainp").css("display","inline");
  $("div#expandmainm").css("display","none");

 //Set window location based on how user got here
 var index=window.location.href.indexOf('#');
   
 if(index>0 && url.length>1) //variable already set
    {
    window.location.href=window.location.href.slice(0,index)+"#"+ID;
    }
 if(index<1 && url.length>1) //New session, url just set
    {
    window.location.href=window.location.href+"#"+ID;
    }
 if(index>0 && url.length<1) //Sent by link
   {
   ID=window.location.href.slice(index+1); 
   }
 if(index<1 && url.length<1) //New Session
  {
  //Show startup screen on new session
  $("div.main").css("display","inline");
  $("div.run").css("display","none");
  $("div#expandmainm").css("display","inline");
  $("div#expandmainp").css("display","none");
  }   

//Set url and data directory based on what the ID is at this point
if(ID.length>1)
 {
 $("#sessionid").html(ID);
 var IP=ID.slice(0,ID.indexOf('-'));
 var UserName=ID.slice(ID.indexOf('-')+1,ID.indexOf('--'));
 var Session=ID.slice(ID.indexOf('--')+2);
 url=cgidir+IP+"/"+UserName+"/"+Session+"/"+ID+".fcgi";
 $("#ClearPath").val(ID);
 $("#datadir").attr("href",datadir+IP+"/"+UserName+"/"+Session);
 }

//Clear password on new session, then check for it to hide it
$("#password").val('');
CheckForPass();
Refresh();  
}


function Refresh() {
//Clear input and get information on session
$("textarea#input").val("");
GetInfo();
}

function StartSession() {
//Send information to spawn.cgi to create new session, then redirect user to returned session
$("form#spawn").submit(function(event){
 event.preventDefault();
 var check = 0;
 if ($("form #PrivateCheck").is(':checked'))
  {
  check=1;
  }
 $.post(spawncgi, {Session: $("#sessionname").val(), UserName: $("#username").val(), PrivateCheck: check, silent: 1},
 function(path){
 url=path;
 $("#sessionid").html(path.replace(/.*\/([\d\.]+-\w+--\w+)\.fcgi/,"$1"));
 $("textarea#input").val("");
 SessionRefresh();
 });
});
}


function Clone() {
 //Clone a current session by spawning a new one with the clone flag set
 $.post(spawncgi, {clone: 1, clonesource: url, silent: 1},
 function(path){
  url=path;
  $("#sessionid").html(path.replace(/.*\/([\d\.]+-\w+--\w+)\.fcgi/,"$1"));
  $("textarea#input").val("");
  SessionRefresh();
});
}


function ReadySubmit(input){
//Submit user commands

//Preprocess to check for errors
var error = PreProcess($("#input").val());
if(error==0) //Only submit if there are no errors
{
//Check to see if session is locked before submitting
$.post(lockcgi, {url:url, password:$("#password").val()},
function(result){
 if(result.indexOf('denied')>0){
  //If session is locked, and password is wrong/blank, don't submit
  //If you're reading this and thinking it's horribly insecure, you're right
  Error("Edits to this session require a password.  Clone the session to create an editable version of this code.");
  return;
  }
 else
 {
 Error(); //Clear error field
 $("#loadspinner").activity({segments: 8, width:2, space: 0, length: 3});
 if(input.indexOf('close')>=0) //If they pushed close all; clear all
  {
  $.post(url, { command: "close all; clear all;", clean: "yes"},
  function(){
   Refresh();
  });
 }
 else
 {
 //If all goes well, submit the command
 executing=1;
 //Also, parse out the non-ascii characters for safety
 $.post(url, { command: $("#input").val().replace(/[^\x09-\x7F]/g,'')},
  function(){
   Refresh();
   executing=0;
  });
 }
}
});
}
}


function htmlDecode(value){
 return $('<div/>').html(value).text();
}

function GetInfo() {
//Get all of the information on the session and fill in relevant fields/menus
$.get(infocgi, { path: window.location.pathname, url: url, option: "drop" },
   function(data){
     var sizecheck=$("span.sizecheck",data).html();
     if(sizecheck.indexOf('exceeded')>1)
     {
     //If they've exceeded their size limit, return here and give them nothing else
     $("#inoutdiv").html(sizecheck);
     return false;
     }

     //Get dropboxes from data and plug their html in
     var pub=$("span.publicdrop",data).html();
     var admin=$("span.admindrop",data).html();
     var restore=$("span.restoredrop",data).html();
     $('#publicdropdiv').html(pub);
     $('#admindropdiv').html(admin);
     $('#restoredropdiv').html(restore);


     var afig=$("span.afig",data).html();
     $('#afig').html(afig);
     
     $("span.aimspan").each(function(){
     console.time("timing here");
      var curspan=$(this);
      var img=$(this).children('.afigim'); 
      curspan.activity({segments: 8, width:2, space: 1, length: 4});
       img.hide();
       img.load(img.attr('src'),function(){
       curspan.activity(false);
       img.show();
       img.load(img.attr("src").replace('alphabits=2','alphabits=4'), function(){
       img.attr("src",img.attr("src").replace('alphabits=2','alphabits=4'));
       });
       img.load(img.attr('src').replace('=400','=900'));
       });
      });
     
     $("img.afigim").click(function(event){
     event.preventDefault();
     var src=$(this).attr("src");
     if(src.match(/width=400/))
      {
      $(this).attr("src",src.replace('=400','=900'));
      }
     else
      {
      $(this).attr("src",src.replace('=900','=400'));
      }
     });

     var inout=$("span.inout",data).html();
     $("#inoutdiv").html(inout);
     ErrorCheck(inout);
     if($("#previousinput").length)
      {
      myCodeMirror.setValue(htmlDecode($("#previousinput").html()));
      }
     

  
  var history=$("span.history",data).html();
  $('div.history').html(history);

  $("td.histblock").mouseover(function(){
  $(this).next().css("border","1px solid #cecece");
  }).mouseout(function(){
  $(this).next().css("border","1px solid transparent");
  });

  $("td.histblock").click(function(e){
  if(e.ctrlKey)
  {
  myCodeMirror.setValue(myCodeMirror.getValue()+"\n"+$(this).next().text().trim());
  }
  else
     {
     myCodeMirror.setValue($(this).next().text().trim());
     }
    });

  $("span.histitem").click(function(e){
  if(e.ctrlKey)
  {
  myCodeMirror.setValue(myCodeMirror.getValue()+"\n"+$(this).text().trim());
  }
  else
     {
     myCodeMirror.setValue($(this).text().trim());
     }   
    });


 var pfig=$("span.pfig",data).html();
 $('#figlist').html(pfig);
 $(".popuplink").mouseover(function(event){
 event.preventDefault();
 $("#popup").activity({segments: 8, width:2, space: 1, length: 4});
 ShowTooltip(event.pageX,event.pageY,"#popup");
 var loadim=$(this);
 $("img.popupim").hide();
 $("img.popupim").load(loadim.attr("href").replace('1000','600'), function(){
   $("img.popupim").attr("src",loadim.attr("href").replace('1000','600'));
   $("#poptitle").html(loadim.html());
   $("img.popupim").show();
   $("#popup").activity(false);
   });
 return false;
 }).mouseout(function(){
 $("#popup").css("display","none");
 });

     DropDown();
 $("#loadspinner").activity(false);

});

}


function CheckForPass(){
//Check to see if password box should be shown
$.post(lockcgi, {url:url, password:$("#password").val()},
function(result){
 if(result.indexOf('denied')>0){
  $("#AskForPass").show();
  }
 if(result.indexOf('set')>0)
 {
 $("#AskForPass").hide();
 }
});
}


function DropDown(){
 $('select.dropdown').each( function() {
   $(this).bind('change', function () {
   url = $(this).val(); 
   if (url) { 
   $("#sessionid").html($("#dropdown :selected").text());
   if(window.location.href.indexOf('admin')>1) //If in admin screen
     {
     base=window.location.href.slice(0,window.location.href.indexOf('/admin'));
     extension=url.slice(url.lastIndexOf('/')+1,url.indexOf('.fcgi'));
     window.location=base+'#'+extension;
     }
   SessionRefresh();
   }
   return false;
  });
 });

 $('select#restoredropdown').each( function() {
   $(this).bind('change', function () {
   url = $(this).val(); 
   if (url) { 
   $("#sessionid").html($("#dropdown :selected").text());
   if(window.location.href.indexOf('admin')>1) //If in admin screen
     {
     base=window.location.href.slice(0,window.location.href.indexOf('/roctave'));
     extension=url.slice(url.lastIndexOf('/')+1,url.indexOf('.fcgi'));
     window.location=base+cgidir+'restore.cgi?file='+extension;
     }
   SessionRefresh();
   }
   return false;
  });
 });


}


function ShowTooltip(mx,my,divstring) {
$(divstring).css({"display":"inline","position":"fixed","left":mx*0+10,"top":my+10});
}

  function wordREM(words) {
    return new RegExp("[^\w]*(" + words.join("|") + ")[^\w]*", "i");
  }


function Warn(message) {
if(message)
 {
 $("#warnings").show();
 $("#warnings").html(message);
 }
else
 {
 $("#warnings").html("");
 $("#warnings").hide();
 }
}

function Error(message) {
if(message)
 {
 $("#errors").show();
 $("#errors").html(message);
 }
else
 {
 $("#errors").html("");
 $("#errors").hide();
 }
}


function PreProcess(data) {
var openw = ["for","if","while","try"];
var closew = ["end","catch"];
var openb = ["{","(","["];
var closeb = ["}",")","]"];
var nopen=0;
var nclose=0;
var error=0;

$.each(openw,function(index,value) {
nopen+=myCodeMirror.getValue().split(RegExp('(?!=[a-zA-Z_])'+value+'(?![a-zA-Z_])')).length-1;
});
$.each(closew,function(index,value) {
nclose+=myCodeMirror.getValue().split(RegExp("(?!=[a-zA-Z_])"+value+"(?![a-zA-Z_])")).length-1;
});
if(nopen != nclose)
 {
 Warn("Mismatched for/if/while loops or try/catch statement\n");
 error=1;
 }

nopen=0;
nclose=0;
$.each(openb,function(index,value) {
nopen+=myCodeMirror.getValue().split(value).length-1;
});
$.each(closeb,function(index,value) {
nclose+=myCodeMirror.getValue().split(value).length-1;
});
if(nopen != nclose)
 {
 Warn("Mismatched brackets\n");
 error=1;
 }
if(error==0)
 {
 Warn();
 }
return error;
}

function ErrorCheck(data) {
var M=new Array();
var Mm=new Array();
M[0]="error: invalid row index";
Mm[0]="Rows go left to right";
M[1]="error: invalid column index";
Mm[1]="Columns go top to bottom";
M[2]="vector lengths must match";
Mm[2]="Your X vector and Y vector are different sizes";
for(i=0;i<M.length;i++)
 {
 if(data.indexOf(M[i])>0)
  {	
  $("#inoutdiv").prepend("<div style=\"background-color:#cecece\">"+Mm[i]+"</div>");
  }
 }
}

