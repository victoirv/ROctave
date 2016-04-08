// LUA mode. Ported to CodeMirror 2 from Franciszek Wawrzak's
// CodeMirror 1 mode.
// highlights keywords, strings, comments (no leveling supported! ("[==[")), tokens, basic indenting

 
CodeMirror.defineMode("lua", function(config, parserConfig) {
  var indentUnit = config.indentUnit;

  function prefixRE(words) {
    return new RegExp("^(?:" + words.join("|") + ")", "i");
  }
  function wordRE(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var specials = wordRE(parserConfig.specials || []);
 
  // long list of standard functions from lua manual
  var builtins = wordRE([
"argv","program_name","program_invocation_name","quit","atexit",
"help","doc","lookfor","news","info",
"warranty","info_file","info_program","makeinfo_program","doc_cache_file",
"suppress_verbose_help_message","clc","completion_append_char","completion_matches","history",
"edit_history","run_history","saving_history","history_file","history_size",
"history_timestamp_format_string","EDITOR","read_readline_init_file","re_read_readline_init_file","PS1",
"PS2","PS4","diary","echo","echo_executing_commands",
"typeinfo","class","isa","cast","swapbytes",
"bitpack","bitunpack","NA","isna","ndims",
"columns","rows","numel","length","size",
"isempty","isnull","sizeof","size_equal","squeeze",
"double","complex","output_max_field_width","output_precision","split_long_rows",
"fixed_point_format","print_empty_dimensions","single","isinteger","int8",
"uint8","int16","uint16","int32","uint32",
"int64","uint64","intmax","intmin","intwarning",
"idivide","bitset","bitget","bitmax","bitand",
"bitor","bitxor","bitcmp","bitshift","logical",
"true","false","isnumeric","isreal","isfloat",
"iscomplex","ismatrix","isvector","isscalar","issquare",
"issymmetric","isdefinite","islogical","isprime","ischar",
"string_fill_char","blanks","char","strvcat","strcat",
"cstrcat","mat2str","num2str","int2str","strcmp",
"strncmp","strcmpi","strncmpi","validatestring","deblank",
"strtrim","strtrunc","findstr","strchr","index",
"rindex","strfind","strmatch","strtok","strsplit",
"strrep","substr","regexp","regexpi","regexprep",
"regexptranslate","bin2dec","dec2bin","dec2hex","hex2dec",
"dec2base","base2dec","num2hex","hex2num","str2double",
"strjust","str2num","toascii","tolower","toupper",
"do_string_escapes","undo_string_escapes","isalnum","isalpha","isascii",
"iscntrl","isdigit","isgraph","isletter","islower",
"isprint","ispunct","isspace","isupper","isxdigit",
"isstrprop","struct_levels_to_print","struct","isstruct","rmfield",
"setfield","orderfields","fieldnames","isfield","getfield",
"substruct","structfun","struct2cell","celldisp","iscell",
"cell","num2cell","mat2cell","cellslices","cellstr",
"iscellstr","cellidx","cellfun","cell2mat","cell2struct",
"ans","isvarname","genvarname","namelengthmax","isglobal",
"who","whos","whos_line_format","exist","clear",
"type","which","what","sub2ind","ind2sub",
"max_recursion_depth","isequal","isequalwithequalnans","ifelse","eval",
"feval","run","evalin","assignin","nargin",
"inputname","silent_functions","nargout","nargchk","nargoutchk",
"parseparams","deal","edit","mfilename","ignore_function_time_stamp",
"addpath","genpath","rmpath","savepath","path",
"pathdef","pathsep","rehash","file_in_loadpath","restoredefaultpath",
"command_line_path","find_dir_in_path","dispatch","builtin","autoload",
"mlock","munlock","mislocked","source","functions",
"func2str","str2func","inline","argnames","formula",
"vectorize","symvar","mark_as_command","unmark_command","iscommand",
"mark_as_rawcommand","unmark_rawcommand","israwcommand","error","print_usage",
"usage","beep","beep_on_error","lasterror","lasterr",
"rethrow","errno","errno_list","warning","lastwarn",
"warning_ids","debug_on_interrupt","debug_on_warning","debug_on_error","dbcont",
"dbquit","dbstop","dbstatus","dbclear","keyboard",
"dbwhere","dbtype","isdebugmode","dbstep","dbstack",
"dbup","dbdown","disp","format","more",
"PAGER","PAGER_FLAGS","page_screen_output","page_output_immediately","fflush",
"input","menu","yes_or_no","kbhit","save",
"load","default_save_options","save_precision","save_header_format_string","native_float_format",
"fdisp","dlmwrite","dlmread","csvwrite","csvread",
"crash_dumps_octave_core","sighup_dumps_octave_core","sigterm_dumps_octave_core","octave_core_file_options","octave_core_file_limit",
"octave_core_file_name","rat","rats","stdin","stdout",
"stderr","fopen","fclose","fputs","puts",
"fgetl","fgets","fskipl","printf","fprintf",
"sprintf","fscanf","scanf","sscanf","fread",
"fwrite","mkstemp","tmpfile","tmpnam","octave_tmp_file_name",
"feof","ferror","fclear","freport","ftell",
"fseek","SEEK_SET","frewind","plot","plotyy",
"semilogx","semilogy","loglog","bar","barh",
"hist","stairs","stem","stem3","scatter",
"plotmatrix","pareto","rose","contour","contourf",
"contourc","contour3","errorbar","semilogxerr","semilogyerr",
"loglogerr","polar","pie","quiver","quiver3",
"compass","feather","pcolor","area","comet",
"axis","caxis","xlim","fplot","ezplot",
"ezcontour","ezcontourf","ezpolar","mesh","meshc",
"meshz","hidden","surf","surfc","surfl",
"surfnorm","diffuse","specular","meshgrid","ndgrid",
"plot3","view","slice","ribbon","shading",
"scatter3","ezplot3","ezmesh","ezmeshc","ezsurf",
"ezsurfc","cylinder","sphere","ellipsoid","title",
"legend","text","xlabel","clabel","box",
"grid","colorbar","subplot","figure","axes",
"line","patch","fill","surface","drawnow",
"refresh","newplot","hold","ishold","clf",
"cla","shg","delete","close","closereq",
"print","orient","ginput","waitforbuttonpress","gtext",
"sombrero","peaks","ishandle","ishghandle","isfigure",
"gcf","gca","get","set","ancestor",
"allchild","findobj","findall","gcbo","gcbf",
"hggroup","addproperty","addlistener","dellistener","linkprop",
"refreshdata","backend","available_backends","gnuplot_binary","any",
"all","xor","is_duplicate_entry","diff","isinf",
"isnan","finite","find","lookup","common_size",
"fliplr","flipud","flipdim","rot90","rotdim",
"cat","horzcat","vertcat","permute","ipermute",
"reshape","resize","circshift","shiftdim","shift",
"sort","sortrows","issorted","tril","vec",
"vech","prepad","diag","blkdiag","arrayfun",
"bsxfun","eye","ones","zeros","repmat",
"rand","randn","rande","randp","randg",
"randperm","linspace","logspace","hadamard","hankel",
"hilb","invhilb","magic","pascal","rosser",
"sylvester_matrix","toeplitz","vander","wilkinson","exp",
"expm1","log","log1p","log10","log2",
"nextpow2","nthroot","pow2","reallog","realpow",
"realsqrt","sqrt","abs","arg","conj",
"cplxpair","imag","real","sin","cos",
"tan","sec","csc","cot","asin",
"acos","atan","asec","acsc","acot",
"sinh","cosh","tanh","sech","csch",
"coth","asinh","acosh","atanh","asech",
"acsch","acoth","atan2","sind","cosd",
"tand","secd","cscd","cotd","asind",
"acosd","atand","asecd","acscd","acotd",
"sum","prod","cumsum","cumprod","sumsq",
"accumarray","ceil","cross","del2","factor",
"factorial","fix","floor","fmod","gcd",
"gradient","hypot","lcm","list_primes","max",
"min","cummax","cummin","mod","primes",
"rem","round","roundb","sign","airy",
"besselj","beta","betainc","betaln","bincoeff",
"commutation_matrix","duplication_matrix","erf","erfc","erfinv",
"gamma","gammainc","legendre","lgamma","cart2pol",
"pol2cart","cart2sph","sph2cart","e","pi",
"I","Inf","NaN","eps","realmax",
"realmin","balance","cond","det","dmult",
"dot","eig","givens","planerot","inv",
"matrix_type","norm","null","orth","pinv",
"rank","rcond","trace","rref","chol",
"cholinv","chol2inv","cholupdate","cholinsert","choldelete",
"cholshift","hess","lu","luupdate","qr",
"qrupdate","qrinsert","qrdelete","qrshift","qz",
"qzhess","schur","subspace","svd","housh",
"krylov","expm","logm","sqrtm","kron",
"syl","bicgstab","cgs","fsolve","fzero",
"spdiags","speye","spfun","spmax","spmin",
"spones","sprand","sprandn","sprandsym","full",
"spalloc","sparse","spconvert","issparse","nnz",
"nonzeros","nzmax","spstats","spy","etree",
"etreeplot","gplot","treeplot","treelayout","sparse_auto_mutate",
"amd","ccolamd","colamd","colperm","csymamd",
"dmperm","symamd","symrcm","normest","onenormest",
"condest","spparms","sprank","symbfact","spaugment",
"eigs","svds","pcg","pcr","luinc",
"quad","quad_options","quadl","quadgk","quadv",
"trapz","cumtrapz","colloc","dblquad","triplequad",
"lsode","lsode_options","daspk","daspk_options","dassl",
"dassl_options","dasrt","dasrt_options","glpk","qp",
"pqpnonneg","sqp","ols","gls","lsqnonneg",
"optimset","optimget","mean","median","quantile",
"prctile","meansq","std","var","mode",
"cov","cor","corrcoef","kurtosis","skewness",
"statistics","moment","mahalanobis","center","studentize",
"nchoosek","histc","perms","values","table",
"spearman","run_count","ranks","range","probit",
"logit","cloglog","kendall","iqr","cut",
"qqplot","ppplot","anova","bartlett_test","chisquare_test_homogeneity",
"chisquare_test_independence","cor_test","f_test_regression","hotelling_test","hotelling_test_2",
"kolmogorov_smirnov_test","kolmogorov_smirnov_test_2","kruskal_wallis_test","manova","mcnemar_test",
"prop_test_2","run_test","sign_test","t_test","t_test_2",
"t_test_regression","u_test","var_test","welch_test","wilcoxon_test",
"z_test","z_test_2","logistic_regression","betacdf","betainv",
"betapdf","binocdf","binoinv","binopdf","cauchy_cdf",
"cauchy_inv","cauchy_pdf","chi2cdf","chi2inv","chi2pdf",
"discrete_cdf","discrete_inv","discrete_pdf","empirical_cdf","empirical_inv",
"empirical_pdf","expcdf","expinv","exppdf","fcdf",
"finv","fpdf","gamcdf","gaminv","gampdf",
"geocdf","geoinv","geopdf","hygecdf","hygeinv",
"hygepdf","kolmogorov_smirnov_cdf","laplace_cdf","laplace_inv","laplace_pdf",
"logistic_cdf","logistic_inv","logistic_pdf","logncdf","logninv",
"lognpdf","nbincdf","nbininv","nbinpdf","normcdf",
"norminv","normpdf","poisscdf","poissinv","poisspdf",
"tcdf","tinv","tpdf","unidcdf","unidinv",
"unidpdf","unifcdf","unifinv","unifpdf","wblcdf",
"wblinv","wblpdf","betarnd","binornd","cauchy_rnd",
"chi2rnd","discrete_rnd","empirical_rnd","exprnd","frnd",
"gamrnd","geornd","hygernd","laplace_rnd","logistic_rnd",
"lognrnd","nbinrnd","normrnd","poissrnd","trnd",
"unidrnd","unifrnd","wblrnd","wienrnd","unique",
"ismember","union","intersect","complement","setdiff",
"setxor","polyval","polyvalm","roots","compan",
"mpoles","conv","convn","deconv","conv2",
"polygcd","residue","polyderiv","polyder","polyint",
"polyfit","ppval","mkpp","unmkpp","poly",
"polyout","polyreduce","interp1","interp1q","interpft",
"spline","interp2","interp3","interpn","bicubic",
"delaunay","delaunay3","delaunayn","triplot","trimesh",
"tsearch","tsearchn","dsearch","dsearchn","voronoi",
"voronoin","polyarea","rectint","inpolygon","convhull",
"convhulln","griddata","griddata3","griddatan","detrend",
"fft","fftw","ifft","fft2","ifft2",
"fftn","ifftn","fftconv","fftfilt","filter",
"filter2","freqz","freqz_plot","sinc","unwrap",
"arch_fit","arch_rnd","arch_test","arma_rnd","autocor",
"autocov","autoreg_matrix","bartlett","blackman","diffpara",
"durbinlevinson","fftshift","ifftshift","fractdiff","hamming",
"hanning","hurst","pchip","periodogram","rectangle_lw",
"rectangle_sw","sinetone","sinewave","spectral_adf","spectral_xdf",
"spencer","stft","synthesis","triangle_lw","triangle_sw",
"yulewalker","imread","imwrite","IMAGE_PATH","imfinfo",
"imshow","image","imagesc","image_viewer","gray2ind",
"ind2gray","rgb2ind","ind2rgb","colormap","brighten",
"autumn","bone","cool","copper","flag",
"gray","hot","hsv","jet","ocean",
"pink","prism","rainbow","spring","summer",
"white","winter","contrast","gmap40","spinmap",
"rgb2hsv","hsv2rgb","rgb2ntsc","ntsc2rgb","lin2mu",
"mu2lin","loadaudio","saveaudio","playaudio","record",
"setaudio","wavread","wavwrite","isobject","methods",
"ismethod","display","saveobj","loadobj","subsref",
"subsasgn","end","subsindex","colon","superiorto",
"inferiorto","time","now","ctime","gmtime",
"localtime","mktime","asctime","strftime","strptime",
"clock","date","etime","cputime","is_leap_year",
"tic","pause","sleep","usleep","datenum",
"datestr","datevec","addtodate","calendar","weekday",
"eomday","datetick","rename","link","symlink",
"readlink","unlink","readdir","mkdir","rmdir",
"confirm_recursive_rmdir","mkfifo","umask","stat","fstat",
"fileattrib","isdir","glob","fnmatch","file_in_path",
"tilde_expand","canonicalize_file_name","movefile","copyfile","fileparts",
"filesep","filemarker","fullfile","tempdir","tempname",
"P_tmpdir","is_absolute_filename","is_rooted_relative_filename","make_absolute_filename","bunzip2",
"gzip","gunzip","tar","untar","zip",
"unzip","pack","unpack","bzip2","urlread",
"urlwrite","system","unix","dos","perl",
"popen","pclose","popen2","EXEC_PATH","fork",
"exec","pipe","dup2","waitpid","WCONTINUE",
"WCOREDUMP","WEXITSTATUS","WIFCONTINUED","WIFSIGNALED","WIFSTOPPED",
"WIFEXITED","WNOHANG","WSTOPSIG","WTERMSIG","WUNTRACED",
"fcntl","kill","SIG","getpgrp","getpid",
"getppid","geteuid","getuid","getegid","getgid",
"getenv","putenv","cd","ls","ls_command",
"dir","pwd","getpwent","getpwuid","getpwnam",
"setpwent","endpwent","getgrent","getgrgid","getgrnam",
"setgrent","endgrent","computer","uname","ispc",
"isunix","ismac","isieee","OCTAVE_HOME","OCTAVE_VERSION",
"license","version","ver","octave_config_info","getrusage",
"md5sum","pkg","mkoctfile","mex","mexext",
"test","assert","fail","demo","rundemos",
"example","speed","bug_report"
  ]);
  var keywords = wordRE(["and","break","elseif","false","nil","not","or","return",
			 "true","function", "end", "if", "then", "else", "do", 
			 "while", "repeat", "until", "for", "in", "local" ]);

  var indentTokens = wordRE(["function", "if","repeat","for","while", "\\(", "{"]);
  var dedentTokens = wordRE(["end", "until", "\\)", "}"]);
  var dedentPartial = prefixRE(["end", "until", "\\)", "}", "else", "elseif"]);

  function readBracket(stream) {
    var level = 0;
    while (stream.eat("=")) ++level;
    return level;
  }

  function normal(stream, state) {
    ch = stream.next();
    if (ch=="%") {
      if (stream.eat("{"))
        return (state.cur = bracketed("lua-comment"))(stream, state);
      stream.skipToEnd();
      return "lua-comment";
    } 
    if (ch == "\"" || ch == "'")
      return (state.cur = string(ch))(stream, state);
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return "lua-number";
    }
    if (/[\w_]/.test(ch)) {
      stream.eatWhile(/[\w\\\-_.]/);
      return "lua-identifier";
    }
    return null;
  }

  function bracketed(style) {
  return function(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "}" && maybeEnd) {
        state.cur = normal;
        break;
      }
      maybeEnd = (ch == "%");
    }
    return style;
  };
 }


  function string(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.cur = normal;
      return "lua-string";
    };
  }
    
  return {
    startState: function(basecol) {
      return {basecol: basecol || 0, indentDepth: 0, cur: normal};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.cur(stream, state);
      var word = stream.current();
      if (style == "lua-identifier") {
        if (keywords.test(word)) style = "lua-keyword";
        else if (builtins.test(word)) style = "lua-builtin";
	else if (specials.test(word)) style = "lua-special";
      }
      if (indentTokens.test(word)) ++state.indentDepth;
      else if (dedentTokens.test(word)) --state.indentDepth;
      return style;
    },

    indent: function(state, textAfter) {
      var closing = dedentPartial.test(textAfter);
      return state.basecol + indentUnit * (state.indentDepth - (closing ? 1 : 0));
    },

   electricChars: "d{}"
  };
});

CodeMirror.defineMIME("text/x-lua", "lua");
