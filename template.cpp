#include <iostream>
#include <string.h>
#include <octave/oct.h>
#include <octave/octave.h>
#include <octave/parse.h>    
#include <malloc.h>
#include <stdio.h>
#include <stdlib.h>
#include <fstream>
#include "fcgi_stdio.h"
#include "fcgi_config.h"
#include <dirent.h>
#include <sys/resource.h> /*rlimit*/
#include <map>

using namespace std; 

std::string urlDecode(std::string str);
void initializePost(std::map <std::string, std::string> &Post);
void INThandler(int sig);
jmp_buf JumpBuffer;

int main (int argc, char* argv[])
{      
 int PID=getpid();
 string DataDir="/var/www/roctave/"; //Default, but should be read from config.txt next
 string CGIDir="/var/www/cgi-bin/roctave/";
 string ReadVars;
 ifstream fin("/etc/roctave/config.txt");
 if(getline(fin,ReadVars))
  {
  /*Assuming directories still end with /roctave*/
  DataDir=ReadVars.substr(ReadVars.find('=')+1,ReadVars.find_last_of('e')-ReadVars.find('='))+'/';
  getline(fin,ReadVars);
  CGIDir=ReadVars.substr(ReadVars.find('=')+1,ReadVars.find_last_of('e')-ReadVars.find('='))+'/';
  }

 fin.close();
 string path=argv[0];
 path=path.substr(path.find_last_of('/')+1,100);
 string IP=path.substr(0,path.find('-')); //If only this were perl
 string UserName=path.substr(path.find('-')+1,path.find("--")-path.find("-")-1);
 string SessionName=path.substr(path.find("--")+2,path.find_last_of('.')-path.find("--")-2);
 string_vector argv2 (2);
 argv2(0) = "embedded";
 argv2(1) = "-q";
 int parse_status;

 /*Limit process to 40% cpu usage and 100MB of memory*/
 string LimitCommands;
 stringstream LimitCommandsTemp;
 LimitCommandsTemp << "cpulimit --pid ";
 LimitCommandsTemp << PID;
 LimitCommandsTemp << " --limit 40 &";
 LimitCommands = LimitCommandsTemp.str();
 int ignore;
 ignore = system(LimitCommands.c_str());
 
 struct rlimit MemLimit;
 MemLimit.rlim_cur=160*1024*1024; /*in bytes, but limits to 100 MB total, somehow*/
 MemLimit.rlim_max=MemLimit.rlim_cur;
 //setrlimit(RLIMIT_AS, &MemLimit);

 /*Doesn't seem to work?
 LimitCommands="ulimit -v 100000";
 system(LimitCommands.c_str());
 */

 /*"Handle" sigsegv*/
 signal(SIGSEGV,SIG_IGN);
 /*Send sigint to a function printing "Execution aborted"*/
 signal(SIGINT,INThandler);

 octave_main (2, argv2.c_str_vec(), 1); //Initialze Octave 

  string SessionFolder = DataDir+IP+"/"+UserName+"/"+SessionName;
  string ComputeFile=	SessionFolder+"/Compute.m";
  string HistFile   =	SessionFolder+"/Hist.txt";
  string InFile    =	SessionFolder+"/Input.txt";
  string OutFile    =	SessionFolder+"/Output.txt";
  string ImgFolder  =   SessionFolder+"/Img/";
  string ArchiveDir = DataDir+"Archive/"+IP+"/"+UserName+"/"+SessionName;
  string RelArchiveDir = "/roctave/Archive/"+IP+"/"+UserName+"/"+SessionName;
  string RelDataDir = 	"/roctave/"+IP+"/"+UserName+"/"+SessionName;
  string RelImgFolder=  RelDataDir+"/Img/";
  FILE* fp;


 while(FCGI_Accept() >=0)
 {
  std::map<string,string> Post;
  initializePost(Post); //Get post data
  string line, SourceFile;
  string command="";


  if(!Post["command"].empty()) //Something in the POST data
  {
   command=Post["command"];
  }

  
   //Print to HistFile before making the page so the HistFile includes your most recent command

   //Print C style

   if(!command.empty()) //Something in the POST data
   {
    if((fp=fopen(HistFile.c_str(),"a")))
    {
     fprintf(fp,"---");
     fputs(command.c_str(),fp);
     fprintf(fp,"\n"); //Cleanliness' sake
     fclose(fp);
    }

    if((fp=fopen(InFile.c_str(),"w")))
    {
     fputs(command.c_str(),fp);
     fprintf(fp,"\n"); //Cleanliness' sake
     fclose(fp);
    }


   /*Archive old pictures*/
   ignore=system(("mkdir -p "+ArchiveDir+"/Img").c_str());
   ignore=system(("mv -f "+SessionFolder+"/Img/* "+ArchiveDir+"/Img --backup=numbered 2>/dev/null").c_str());
    /*Print input to screen before making changes*/

     command.insert(0,"warning('off','all');\n"
        "close all;\n"
        "set(0,'DefaultFigureVisible','off');\n"
	"set(0,'DefaultFigurePaperPosition',[0,0,8,6])\n");
     if(Post["clean"].empty())
       {
        command.append("\nzzz=get(0,'children');"
	"for zzz2=1:length(zzz) "
	"print(zzz(zzz2),'-deps','-color',['"+ImgFolder+"' strftime(\"%Y.%m.%d.%T\",localtime(time())) '-' int2str(zzz2) '.eps']);"
	" end\n");
       } 

 if(!Post["clean"].empty())
  {
   command="close all\nclear all\n";
   ignore=system(("mv "+SessionFolder+"/Hist.txt "+ArchiveDir+" --backup=numbered").c_str());
   ignore=system(("touch "+SessionFolder+"/Hist.txt").c_str());
  }


    //Print command to file
    if((fp = fopen(ComputeFile.c_str(),"w")))
    {
     fprintf(fp,"new=fopen(\"%s\",\"w\");\n"
       "dup2(new,stdout);\n"
       "dup2(new,stderr);\n"
       "try \n",OutFile.c_str());
     fputs(command.c_str(),fp);
     fprintf(fp," \ncatch\n disp(lasterror.message) \n lasterror('reset') \n end_try_catch\n"); 
     fclose(fp);
    }

    /*Submit commands to octave*/
    SourceFile="source(\""+ComputeFile+"\");"; //Read from compute.m
    octave_value retval = eval_string(SourceFile,false,parse_status);
   //setjmp(JumpBuffer);
   }


printf("Content-type: text/html\r\n\r\n");

 } //End fcgi_Accept
} //End main


void INThandler(int sig)
{
 int parse_status;
 eval_string("error(\"Execution aborted.\");",false,parse_status);
}


/*
URL Decoding and POST handling from Guy Rutenberg under the MIT License
Found here: http://www.guyrutenberg.com/wp-content/uploads/2007/09/getpost.h
*/

std::string urlDecode(std::string str)
{
 std::string temp;
 register int i;
 char tmp[5], tmpchar;
 strcpy(tmp,"0x");
 int size = str.size();
 for (i=0; i<size; i++) {
  if (str[i]=='%') {
   if (i+2<size) {
    tmp[2]=str[i+1];
    tmp[3] = str[i+2];
    tmp[4] = '\0';
    tmpchar = (char)strtol(tmp,NULL,0);
    temp+=tmpchar;
    i += 2;
    continue;
   } else {
    break;
   }
  } else if (str[i]=='+') {
   temp+=' ';
  } else {
   temp+=str[i];
  }
 }
 return temp;
}

void initializePost(std::map <std::string, std::string> &Post)
{
 std::string tmpkey, tmpvalue;
 std::string *tmpstr = &tmpkey;
 int content_length;
 register char *ibuffer;
 char *buffer = NULL;
 char *strlength = getenv("CONTENT_LENGTH");
 if (strlength == NULL) {
  Post.clear();
  return;
 }
 content_length = atoi(strlength);
 if (content_length == 0) {
  Post.clear();
  return;
 }

 try {
  buffer = new char[content_length+1];
 } catch (std::bad_alloc xa) {
  Post.clear();
  return;
 }
 if(fread(buffer, sizeof(char), content_length, stdin) != (unsigned int)content_length) {
  Post.clear();
  return;
 }
 *(buffer+content_length) = '\0';
 ibuffer = buffer;
 while (*ibuffer != '\0') {
  if (*ibuffer=='&') {
   if (tmpkey!="") {
    Post[urlDecode(tmpkey)] = urlDecode(tmpvalue);
   }
   tmpkey.clear();
   tmpvalue.clear();
   tmpstr = &tmpkey;
  } else if (*ibuffer=='=') {
   tmpstr = &tmpvalue;
  } else {
   (*tmpstr) += (*ibuffer);
  }
  ibuffer++;
 }
 //enter the last pair to the map
 if (tmpkey!="") {
  Post[urlDecode(tmpkey)] = urlDecode(tmpvalue);
  tmpkey.clear();
  tmpvalue.clear();
 }
}
