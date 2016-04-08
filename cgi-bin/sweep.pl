#!/usr/bin/perl

#Used to sweep out inactive sessions

use File::stat;

#Get configuration variables
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
if($line=~/TimeInactive=(.*)/)
 {
  $TimeInactive=$1;
 }
}
close(FH);

#Populate access control list to see if anything is whitelisted (not to be pruned)
%access=();
open(FH,"<accesslist.txt");
while($line=<FH>)
{
if($line!~/#/)
 {
 $line=~/(.*):(.*)/;
 $access{$2}=$1;
 }
}
close(FH);

my $ArchiveDir="$DataDir/Archive";

#Get listing of all sessions based on their last computation
my @files=<$DataDir/*.*/*/*/Compute.m>; 

foreach $file(@files)
{
#Find last modified time of each file
my $sh=stat($file);
my $lastmod = $sh->mtime;
my $currenttime=time();

my $diff=$currenttime-$lastmod;
#If last command was more than $TimeInactive ago in seconds
if($diff>$TimeInactive) 
 {
 if($file=~/([\d\.]+)\/(\w+)\/(\w+)/)
 {
 #Get details of which session to sweep
 $IP=$1;
 $UserName=$2;
 $Session=$3;

 if(not exists $access{$IP}) #If it exists in hash and made it to a sweep, it's on the whitelist and won't be killed
  {
  #Archive session
  `mkdir -p $ArchiveDir/$IP/`;
  `mv $DataDir/$IP/$UserName/$Session/ $ArchiveDir/$IP/$UserName --backup=numbered`;
  `rm -rf $CGIDir/$IP/$UserName/$Session/`;

  #Remove session from public listing
  open(FH,"<$CGIDir/public.txt");
  @lines=<FH>;
  close(FH);
  open(FH,">$CGIDir/public.txt");
  foreach $line(@lines)
   {
   if($line!~/$IP-$UserName--$Session/)
    {
    print FH $line;
    }
   }
  close(FH);

  #Kill session's running process
  $a=`ps aux | grep $Session.fcgi`;
  $a=~/\w+?\s+?(\d+)/;
  `kill $1`;
  #Kill CPU Limiter
  $a=`ps aux | grep cpu.*$1`;
  $a=~/\w+?\s+?(\d+)/;
  `kill $1`;
  }
 }
 }
}
