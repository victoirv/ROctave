#!/usr/bin/perl

#Get information for a specific session and return it in preformatted html

use CGI;
my $cgi=new CGI;

#Read in config variables
open(FH,"</etc/roctave/config.txt");
while ($line=<FH>)
{
if($line=~/DataDir=(.*)/)
 {
 $DataDir=$1;
 }
 if($line=~/CGIDir=(.*)/)
 {
 $CGIDir=$1;
 }
 if($line=~/SizeLimit=(.*)/)
 {
 $SizeLimit=$1;
 }
}
close(FH);

my $ArchiveDir="$DataDir/Archive";

#Get all post/get cgi values
for my $key ( $cgi->param() ) {
        $input{$key} = $cgi->param($key);
}

#Read in which IP/User/Session to get info for
my $option=$input{option};
my $url=$input{url};
$url=~/([\d\.]+)-(\w+)--(\w+)/;
$myIP=$1;
$myUserName=$2;
$mySession=$3;

#Required response header
print "Content-type:text/html\n\n";

#Wrapper span
print "<span class=\"wrap\">\n";


########
#Size limit check

print "<span class=\"sizecheck\">\n";
if($myIP && $mySession)
{
#Use 'du' to check base folder size
$size=`du $CGIDir/$myIP/$myUserName/$mySession/ --max-depth=0`;
$size=~/^(\d+)/;
$size=$1;
if($size>$SizeLimit)
 {
 print "You have exceeded the storage space limit $SizeLimit kb. You're storing $size kb. Use unlink() to remove files.\n";
 }
}
print "</span>";


########
#Previous figures

 print "<span class=\"pfig\">\n";
 #Grep archived figure directory for all files
 @files=<$ArchiveDir/$myIP/$myUserName/$mySession/Img/*>;
 
 #Print them all using imgconvert formatted links
 foreach $file(@files){
 $file=~s/\/var\/www//;
 $file=~/Img\/(.+\..+)\.eps/;
 $imgconv="/cgi-bin/imgconvert2.cgi?in=http://" . $ENV{HTTP_HOST} . $file;
 print "<a href=\"$imgconv&width=900\" class=\"popuplink\" target=\"_blank\" title=\"Open in a new window\">$1 - png</a> |\n";
 print "<a href=\"$file\" target=\"_blank\"> (eps)</a><br>\n";
 }
print "</span>\n";


######
#Active figures
print "<span class=\"afig\">\n";
#Grep all active images
@files=<$DataDir/$myIP/$myUserName/$mySession/Img/*>;

#Print them all using imgconvert formatted links
if(scalar(@files)>0)
 {
 print "<h3>Active Figures</h3>\n"
 }
 foreach $file(@files){
 $file=~s/\/var\/www//;
 $file=~/Img\/(.+\..+)/;
 $imgconv="/cgi-bin/imgconvert2.cgi?in=http://" . $ENV{HTTP_HOST} . $file;
 print "<span class=\"aimspan\"><img src=\"$imgconv&width=400&textalphabits=4&graphicsalphabits=2\" class=\"afigim\"></span><br>\n";
 }
print "</span>";


######
#Input and output
print "<span class=\"inout\">\n";

#Read input and output files, format them into html, and send back
 open(FH,"<$DataDir/$myIP/$myUserName/$mySession/Input.txt");
 @lines=<FH>;
 if(scalar(@lines)>0)
  {
  print "<h3>Input:</h3>\n<pre id=\"previousinput\">";
  }
 foreach $line(@lines)
 {
 if(length($line)>1) #If more than a newline
  {
  print "$line";
  }
 }
 close(FH);
 if(scalar(@lines)>0)
  {
  print "</pre>";
  }

 open(FH,"<$DataDir/$myIP/$myUserName/$mySession/Output.txt");
 @lines=<FH>;
 if(scalar(@lines)>0)
  {
  print "<h3>Output:</h3>\n<pre>";
  }
 foreach $line(@lines)
 {
 print "$line";
 }
 close(FH);
 if(scalar(@lines)>0)
  {
  print "</pre>";
  }
print "</span>";

###############
#Drop downs

######
#Public

 print <<EndHTML;
 <span class="publicdrop"> 
 <select class="dropdown">\n
 <option value="" selected>Publicly Running Sessions</option>
EndHTML

 #Read in sessions from public.txt and format into drop down menu
 open FH,"<","public.txt";
 while($file=<FH>)
 {
 $file="$CGIDir/$file";
 $file=~s/\/var\/www//;
 $file=~/([\d\.]+)-(\w+)--(\w+)/;
 $IP=$1;
 $UserName=$2;
 $Session=$3;
 if($Session ne $mySession) #Don't print current session (if any) in list
  {
  print "<option value=\"$file\">$IP - $UserName - $Session</option>\n";
  }
 }
close(FH);
print "</select></span>\n";

####
#Admin Dropdown to show *all* running sessions, not just public

 print <<EndHTML;
 <span class="admindrop">
 <select class="dropdown">\n
 <option value="" selected>All Running Sessions</option>
EndHTML

 #Get sessions from grepping entire base directory
 @files=<$CGIDir/*/*/*/*-*.fcgi>;
 foreach $file(@files)
 {
 $file=~s/\/var\/www//;
 $file=~/([\d\.]+)-(\w+)--(\w+)/;
 $IP=$1;
 $UserName=$2;
 $Session=$3;
 if($Session ne $mySession) 
  {
  print "<option value=\"$file\">$IP - $UserName - $Session</option>\n";
  }
 }
print "</select></span>\n";

#########
#Restore dropdown
#List all sessions that user can restore

$RelCGI=$CGIDir;
$RelCGI=~s/\/var\/www//;
 print <<EndHTML;
 <span class="restoredrop"> 
 <select id="restoredropdown">\n
 <option value="" selected>Archived Sessions</option>
EndHTML

 #Find sessions by formatted backup files
 @files=<$ArchiveDir/*/*/*/*.back>;
 foreach $file(@files)
 {
 $file=~s/\/var\/www\/Archive\///;
 $file=~/([\d\.]+)-(\w+)--(\w+)/;
 $IP=$1;
 $UserName=$2;
 $Session=$3;
 if($Session ne $mySession)
  {
  print "<option value=\"$file\">$IP - $UserName - $Session</option>\n";
  }
 }
print "</select></span>\n";

#########
#History
#Get all history for a session and format it into HTML that jquery knows how to handle

print "<span class=\"history\">\n";
open FH, "<", "$DataDir/$myIP/$myUserName/$mySession/Hist.txt";
$lastline="";
@lines=<FH>;
$inblock=0; #Flag to say if set of commands can be grouped
print "<table>\n";
for($a=0;$a<scalar(@lines);$a++)
 {
 if($lines[$a]=~/---/ && $a+1<scalar(@lines) && $lines[$a+1]!~/---/)
  {
  #a --- signifies a command. 
  #If this line has one and next line doesn't, start a block
  $inblock=1; 
  print "<tr><td class=\"histblock\" title=\"Ctrl+Click appends commands\"> </td><td><pre class=\"histpre\">";
  }
 if($inblock==0)
  {
  print "<tr><td> </td><td>"; #Print empty first <td> so css doesn't shade it
  }

 #Clean up the line and print it
 $cleanline=$lines[$a];
 $cleanline=~s/---//;
 if(($lines[$a+1]=~/---/ && $lines[$a]!~/---/) || ($a==$#lines))
  { 
  #If last line in block, or only line in history, clear out last newline
  chomp($cleanline);
  }
 #Print the line as an individual histitem 
 print "<span class=\"histitem\" title=\"Ctrl+Click appends command\">$cleanline</span>";
 if($inblock==0)
  {
  print "</td></tr>\n";
  }
 if($lines[$a+1]=~/---/ && $lines[$a]!~/---/)
  {
  #If next line is new command and this one is still in a block, end the block
  $inblock=0;
  print "</pre></td></tr>\n";
  }
 }
print "</table>\n";
print "</span>\n";
print "</span>\n"; #end span wrapper


