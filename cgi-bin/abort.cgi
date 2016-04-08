#!/usr/bin/perl

#Given a session name, finds the process ID and sends a signal interrupt
#to the process, which handles it by aborting the current submission.

use CGI;
my $cgi=new CGI;


for my $key ( $cgi->param() ) {
        $input{$key} = $cgi->param($key);
}

#If user doesn't just send in full path
my $Session=$input{Session};
my $UserName=$input{UserName};
my $IP=$ENV{'REMOTE_ADDR'};

#Take path and parse it
my $path=$input{path};
if($path=~/([\d\.]+)-(\w+)--(\w+)/)
{
 $IP=$1;
 $UserName=$2;
 $Session=$3;
}

#Find PID and send a SIGINT
$a=`ps aux | grep $Session.fcgi`;
$a=~/\w+?\s+?(\d+)/;
`kill -2 $1`;

#So jquery doesn't wait for reply and timeout
print "Content-type:text/html\n\n";

