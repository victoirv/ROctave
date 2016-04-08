#!/usr/bin/perl

use CGI;
my $cgi=new CGI;

#Read in configuration variables
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

#If individual variables sent in
my $Session=$input{Session};
my $UserName=$input{UserName};
my $IP=$ENV{'REMOTE_ADDR'};

#If entire path sent in
my $path=$input{ClearPath};
if($path=~/([\d\.]+)-(\w+)--(\w+)/)
{
 $IP=$1;
 $UserName=$2;
 $Session=$3;
}

#Make archive path, move data into it
`mkdir -p $ArchiveDir/$IP/$UserName/$Session`;
`mv $DataDir/$IP/$UserName/$Session/* $ArchiveDir/$IP/$UserName/$Session/ --backup=numbered`;
`touch $ArchiveDir/$IP/$UserName/$Session/$IP-$UserName--$Session.back`;

#Remove all current files
`rm -rf $DataDir/$IP/$UserName/$Session/`;
`rm -rf $CGIDir/$IP/$UserName/$Session/`;

#Clear session out of public listing
open FH, '<', "$CGIDir/public.txt";
@contents=<FH>;
close FH;
open FH, '>', "$CGIDir/public.txt";
foreach $line(@contents)
 {
 if($line!~/$IP-$UserName--$Session/)
  {
  print FH $line;
  }
 }
close FH;


#Kill the running fcgi and cpulimit processes
$a=`ps aux | grep $Session.fcgi`;
$a=~/\w+?\s+?(\d+)/;
$PID=$1;
$a=`ps aux | grep cpu.*$PID`;
$a=~/\w+?\s+?(\d+)/;
`kill $1`;
`kill $PID`;

#Print a redirect to send user back home
print "Content-type:text/html\n\n";
print <<EndOfHTML;
<html><head><title>Spawner</title>
<meta HTTP-EQUIV="REFRESH" content="0; url=/roctave"/>
</head>
<body>
Process removed. Redirecting you home. If it fails, please click <a href="/roctave">here</a>.
</body>
</html>

EndOfHTML

