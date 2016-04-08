HTMLDIR=/var/www/roctave
CGIDIR=/var/www/cgi-bin/roctave
TIMEINACTIVE=3600
SIZELIMIT=5000
USR=www-data
BASEURL=http://aurora.gmu.edu/roctave
CONFFILE=/etc/roctave/config.txt

CC=mkoctfile
CFLAGS=--link-stand-alone -lfcgi -Wall
SOURCES=template.cpp
EXECUTABLE=$(SOURCES:.cpp=.fcgi)

all: $(SOURCES:.cpp=.fcgi)

%.fcgi : %.cpp
	$(CC) $(CFLAGS) $^ -o $(EXECUTABLE)

install: $(SOURCES:.cpp=.fcgi)
	rm -rf $(CGIDIR)/*
	rm -rf $(HTMLDIR)/*
	mkdir -p $(HTMLDIR)
	mkdir -p $(HTMLDIR)/admin
	mkdir -p $(CGIDIR)
	mkdir -p /etc/roctave/
	cp $(EXECUTABLE) $(CGIDIR)
	cp -r html/* $(HTMLDIR)
	cp cgi-bin/* $(CGIDIR)
	echo 'DataDir=$(HTMLDIR)' > $(CONFFILE)
	echo 'CGIDir=$(CGIDIR)' >> $(CONFFILE)
	echo 'TimeInactive=$(TIMEINACTIVE)' >> $(CONFFILE)
	echo 'SizeLimit=$(SIZELIMIT)' >> $(CONFFILE)
	echo 'BaseURL=$(BASEURL)' >> $(CONFFILE)
	echo '#Enter IP addresses to white/blacklist here' > $(CGIDIR)/accesslist.txt
	echo '#In the form w:192.168.1.100 for a whitelist' > $(CGIDIR)/accesslist.txt
	echo '#b:192.168.1.101 for a blacklist' > $(CGIDIR)/accesslist.txt
	echo -e '\nNow enter a password for the administrator:'
	htpasswd -c $(HTMLDIR)/admin/passwd admin
	echo 'AuthUserFile $(HTMLDIR)/admin/passwd' >> $(HTMLDIR)/admin/.htaccess
	chown -R $(USR):$(USR) $(HTMLDIR)
	chown -R $(USR):$(USR) $(HTMLDIR)/admin/
	chown -R $(USR):$(USR) $(CGIDIR)
	- killall cpulimit

clean:
	rm -f $(SOURCES:.cpp=.o) $(EXECUTABLE)
