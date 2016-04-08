#!/usr/bin/perl

#Used for restoring sessions specified by the user.

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
}
close(FH);

my $ArchiveDir="$DataDir/Archive";

for my $key ( $cgi->param() ) {
        $input{$key} = $cgi->param($key);
}

#If user manually supplies variables
my $IP=$input{IP};
my $UserName=$input{UserName};
my $Session=$input{Session};
my $File=$input{file};

#If the typical formatted ID is supplied instead (Default)
if($File=~/([\d\.]+)-(\w+)--(\w+)/)
 {
 $IP=$1;
 $UserName=$2;
 $Session=$3;
 }

#Remake active folder, copy archived files back in, then remove backups
`mkdir -p $DataDir/$IP/$UserName/$Session`;
`cp -r $ArchiveDir/$IP/$UserName/$Session/* $DataDir/$IP/$UserName/$Session/ --backup=numbered`;
`rm -rf $ArchiveDir/$IP/$UserName/$Session/*`;

#Tell spawn.cgi to recreate fcgi session with same details
print "Content-type:text/html\n\n";
print <<EndOfHTML;
<html><head><title>Spawner</title>
<meta HTTP-EQUIV="REFRESH" content="0; url=/cgi-bin/roctave/spawn.cgi?Session=$Session&IP=$IP&UserName=$UserName"/>
</head>
<body>
Process recreated. Redirecting you. If it fails, please click <a href="/cgi-bin/roctave/spawn.cgi?Session=$Session&IP=$IP&UserName=$UserName">here</a>.
</body>
</html>

EndOfHTML

