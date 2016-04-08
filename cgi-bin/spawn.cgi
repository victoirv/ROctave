#!/usr/bin/perl

#For spawning new sessions

use CGI;
#Start by sweeping out old files
`perl sweep.pl`; 

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
 if($line=~/BaseURL=(.*)/)
 {
 $BaseURL=$1;
 }
}
close(FH);

#Populate access control list into hash
%access=();
open(FH,"<accesslist.txt");
while($line=<FH>)
{
chomp($line);
if($line!~/#/) #If not a commented line
 {
 $line=~/(.*):(.*)/;
 $access{$2}=$1;
 }
}
close(FH);


#Get IP address
$IP=$ENV{'REMOTE_ADDR'};

#Check to see if IP is blacklisted
if($access{$IP}=~'b')
{
print "Content-type:text/html\n\n";
print "Your IP address $IP is blacklisted.\n<br>";
exit;
}
else
{
#If not blacklisted, press onwards
$cgi = new CGI;
for $key ( $cgi->param() ) 
 {
 $input{$key} = $cgi->param($key);
 }

#Parse out session and username to only be digits, word characters, and make all uppercase
$Session=$input{Session};
$Session=~s/[^\d\w]//g;
$Session=uc($Session);

$UserName=$input{UserName};
$UserName=~s/[^\d\w]//g;
$UserName=uc($UserName);

#Variable for flag to set session as private
$Private=$input{PrivateCheck};

#Establish character set for random names
my @chars=('A'..'Z');

#If username or session are blank before/after parsing, make them up
if($Session!~m/(\d+|\w+)/)
 {
 #Create random 5 character username
 $Session = join '', map $chars[rand @chars], 0..5; 
 }

if($UserName!~m/(\d+|\w+)/)
 {
 #Create random 5 character username
 $UserName = join '', map $chars[rand @chars], 0..5;
 }

if(length($Session)>15)
 {
 $Session = substr($Session,0,15);
 }
if(length($UserName)>15)
 {
 $UserName= substr($UserName,0,15);
 }


#Make data directory
`mkdir -p $DataDir/$IP/$UserName/$Session/Img/`;
#Make compute.m so sweeping has file to check stats of
#Made here in event user starts session but never inputs anything, so it'll stil be sweeped
`touch $DataDir/$IP/$UserName/$Session/Compute.m`;
#Make folder for fcgi file
`mkdir -p $IP/$UserName/$Session/`;

#If a command exists, put it into the input file so it'll show up at start
#(Used for submitting "Try me" commands)
if($input{command}=~/.{2,}/)
 {
 open(FH,">$DataDir/$IP/$UserName/$Session/Input.txt");
 print FH $input{command};
 close(FH);
 }

#If session ip/user/session combo doesn't already exist
@files=<$CGIDir/$IP/$UserName/$Session/*.fcgi>;
$files=join(',',@files);
if($files!~/$IP-$UserName--$Session/)
{
 #Create fcgi file and relevant directories
 `cp template.fcgi $IP/$UserName/$Session/$IP-$UserName--$Session.fcgi`;
 `touch $DataDir/$IP/$UserName/$Session/$IP-$UserName--$Session.back`;
 `ln -s $CGIDir/$IP/$UserName/$Session/ $DataDir/$IP/$UserName/$Session/UserFiles`;
 if($Private!=1)
  {
  #If user didn't request private session, add it to public listing
  `echo "$IP-$UserName--$Session.fcgi" >> public.txt`;
  }
}

#If we're also cloning a session, spawn one, then move cloned information over
if($input{clone}==1)
 {
 $source = $input{clonesource};
 $source=~/([\d\.]+)-(\w+)--(\w+)/;
 $CopyIP=$1;
 $CopyUser=$2;
 $CopySess=$3;
 $CopyFolder="$DataDir/$CopyIP/$CopyUser/$CopySess";
 $DestFolder="$DataDir/$IP/$UserName/$Session"; 

 #Copy all files, images, user data over, then remove backup and password
 `cp -r $CopyFolder/* $DestFolder/`;
 `rm -f $DestFolder/*.back $DestFolder/pass.txt`;
 }



print "Content-type:text/html\n\n";

#If coming from a "try me" command
$Try=$input{try};

if($Try=~/1/)
{
 #Get the callback jsonp function and send the url back that way to get around anti-XSS
 $Callback=$input{callback};
 print "$Callback({url:'$BaseURL/#$IP-$UserName--$Session'});";
 return;
}


$Silent=$input{silent};

#If not a silent spawn request, return a redirect page
if($Silent!~1) 
 {
$RelData=$DataDir;
$RelData=~s/.*(\/roctave.*)/$1/;
print <<EndOfHTML;
<html><head><title>Restored</title>
<meta HTTP-EQUIV="REFRESH" content="0; url=$RelData/#$IP-$UserName--$Session">
</head>
<body>
Process recreated. Redirecting you. If it fails, please click <a href="$RelData/#$IP-$UserName--$Session">here</a>.
</body>
</html>

EndOfHTML

 }
else #Else just return a link to the session for jquery to parse
 {
 print "/cgi-bin/roctave/$IP/$UserName/$Session/$IP-$UserName--$Session.fcgi";
 }

}
