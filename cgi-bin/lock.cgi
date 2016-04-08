#!/usr/bin/perl
#Simple script to check if a file is locked and to lock it if needed.
#Also does checks to see if user submits proper password to edit

use CGI;
my $cgi=new CGI;

#Get config variables
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

#Get user-supplied password and jquery-supplied session
my $password=$input{password};
my $url=$input{url};
$url=~/([\d\.]+)-(\w+)--(\w+)/;
$myIP=$1;
$myUserName=$2;
$mySession=$3;

print "Content-type:text/html\n\n";
$lockfile="$DataDir/$myIP/$myUserName/$mySession/pass.txt";

#If lockfile exists, mark session as being locked
$lock=0;
if(-e $lockfile)
 {
 $lock=1;
 }

#If no lock set, but password provided, lock the session
if($lock==0 && length($password)>=1)
 {
 @salts=map{("a".."z")[rand 26]} 1..2; #random two-character salt
 $salt=join('',@salts);

 #Print crypt of password into pass file
 open(FH,">$lockfile");
 print FH crypt($password,$salt);
 close(FH);
 }

#If no lock set and no password provided, do nothing
if($lock==0 && length($password)<1)
 {
 print "Password not set";
 }

#If lock file exists, check for password
if($lock==1)
 {
 open(FH,"<$DataDir/$myIP/$myUserName/$mySession/pass.txt");
 $pass=<FH>;
 close(FH);
 #If they provide correct password, say so for jquery to parse
 if(crypt($password,$pass) eq $pass)
  {
  print "Access granted";  
  }
 else
  {
  print "Access denied";
  }
 }


