## ROctave
Allows multiple users to run a persistent (using Fast-CGI) and sharable Octave session through a web browser.

Features:
* Memory limited using rlimit (minimum requirement of 50 MB per session)
* CPU limited using cpulimit (default 40% CPU)
* Disk space limited using rlimit
* Session sharing
* Listed and unlisted sessions
* Multiple plots (using, e.g., figure(1);plot(rand(10,1));figure(2);plot(rand(5,1));
* Admin interface for use with Amazon cloud

Requirements:
* Apache 2+
* Octave 3.2+
* Fast-CGI and its Apache modules
* Imgconvert (http://aurora.gmu.edu/svn/imgconvert) 

Security:
* List of IP address blocks that may submit programs.

Installation (Ubuntu):
* sudo apt-get install octave3.2 octave3.2-headers 
* sudo apt-get install libfcgi libapache2-mod-fcgid libfcgi-dev
* /etc/init.d/apache2 reload
* svn co http://aurora.gmu.edu/svn/octaveweb/commandline-fcgi commandline-fcgi/

Compile:
* System variables (modify in makefile)
..* Server root directory: /var/wwww 
..* Cgi-bin directory: /var/www/cgi-bin
..* Apache username: www-data
* cd commandline-fcgi
* make
* sudo make install

Run:
* Open http://localhost/roctave/

Administer:
* Open http://localhost/admin.html


