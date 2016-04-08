#!/usr/bin/perl

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
}
close(FH);

my $ArchiveDir="$DataDir/Archive";

for my $key ( $cgi->param() ) {
        $input{$key} = $cgi->param($key);
}

#Accept user specified limiters
my $IP=$input{IP};
my $Session=$input{Session};
my $UserName=$input{UserName};

#If user doesn't specify limiters, search for everything
if(length($IP)==0)
 {$IP="*";}
if(length($Session)==0)
 {$Session="*";}
if(length($UserName)==0)
 {$UserName="*";}

#Grep all files matching search terms
@files=<$DataDir/$IP/$UserName/$Session/Hist.txt>;



#Print html that creates page
print "Content-type:text/html\n\n";
print <<ENDHtml;
<head>
<META HTTP-EQUIV="Refresh" CONTENT="10;">
</head>
<body>

<style type="text/css">
<!--

div.histlist {
min-height:100px;
max-height:300px;
overflow:auto;
border:1px solid black;
}

td {
vertical-align:top;
}
-->
</style>

<form method="get" action="history.cgi">
Displays history files selected by the user. <br>
Any field not specified is considered a "*", and any perl regex values work for selection.<br>
The page will automatically refresh every 10 seconds.
<table width="200px">
<tr>
<td align="right" width="50%">IP</td> <td><textarea name="IP" cols="15" rows="1"></textarea></td>
</tr>
<tr>
<td align="right" width="50%">UserName</td><td><textarea name="UserName" cols="15" rows="1"></textarea></td>
</tr>
<tr>
<td align="right" width="50%">Session</td><td><textarea name="Session" cols="15" rows="1"></textarea></td>
</tr>
<tr><td></td>
<td>
<input type="submit" value="Submit">
</td></tr>
</table>
</form>
<br>
ENDHtml


#Scan all matching files and print out their history in a table
$col=0; #Spreads out list into two columns if there are enough histories
print "<table width=\"100%\">\n";
foreach $file(@files)
 {
 $file=~/([\d\.]+)\/(\w+)\/(\w+)/;
 $name="$1 - $2 - $3";
 $ID="$1-$2--$3";
 #Get last modified time
 $time = localtime((stat($file))[9]);
 if($col==0)
  {
  print "<tr>\n"; #start a tr if on left column
  #Read in history file and fill table with it
  open(FH,"<$file");
  print "<td width=\"50%\"><a href=\"/roctave/#$ID\">$name</a> | Edited - $time<br><div class=\"histlist\"><pre>\n";
  while($line=<FH>)
  {
  $line=~s/---//;
  print $line;
  }
  close(FH);
  print "</pre></div></td>";
  $col=1;
  }
 else
  {
  open(FH,"<$file");
  print "<td><a href=\"/roctave/#$ID\">$name</a> | Edited - $time<br><div class=\"histlist\"><pre>\n";
  while($line=<FH>)
  {
  $line=~s/---//;
  print $line;
  }
  close(FH);
  #Clean up tables
  print "</pre></div></td>";
  print "</tr>";
  print "<tr height=\"20px\"></tr>";
  $col=0;
  } 
 }
print "</table>";

#Scroll all lists to the end so the user sees most recent commands
print <<EndHTML;
<script type="text/javascript">
hists=document.getElementsByClassName('histlist');
for(i=0;i<hists.length;i++)
{
 hists[i].scrollTop=hists[i].scrollHeight;
}

</script>

EndHTML

