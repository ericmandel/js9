
/* description: Parses and executes region expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[a-zA-Z0-9_@#%^;:.*+/-]+     return 'WORD'
\"([^"]*)\"           return 'DSTRING'
\'([^']*)\'           return 'SSTRING'
\/([^\/]*)\/          return 'REGEXP'
'('                   return '('
')'                   return ')'
'||'                  return 'OR'
'OR'                  return 'OR'
'&&'                  return 'AND'
'AND'                 return 'AND'
'!'                   return 'NOT'
'NOT'                 return 'NOT'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left  'OR' 'AND'
%right 'NOT'

%start select

%{

function jisonSelect(s){
    const r = [];
    if( !JS9.tmp.regSelect ){
      JS9.error("region selection parse not configured");
    }
    if( !JS9.isImage(JS9.tmp.regSelect.im) ){
      JS9.error("invalid image specified for selection parser");
    }
    if( !JS9.tmp.regSelect.layer ){
      JS9.error("no layer specified for selection parser");
    }
    if( !JS9.tmp.regSelect.all ){
      JS9.error("all shapes not specified for selection parser");
    }
    JS9.tmp.regSelect.im._selectShapes(JS9.tmp.regSelect.layer, s, null,
        (obj) => {
	    let grp;
            if( obj.params ){
	        if( obj.params.groupid ){
		    if( $.inArray(obj.params.groupid, r) < 0 ){
		        r.push(obj.params.groupid);
		    }
		} else {
		    r.push(obj.params.id);
	        }
	    } else if( obj.type === "group" ){
		grp = obj.getObjects();
		if( grp && grp[0] && grp[0].params.groupid ){
		    if( $.inArray(obj.params.groupid, r) < 0 ){
		        r.push(grp[0].params.groupid);
		    }
		}
	    }
        });
    return r;
}

function jisonAnd(s, t){
    return s.filter(value=>t.includes(value));
}

function jisonOr(s, t){
    return [...new Set([...s, ...t])];
}

function jisonNot(s){
    return JS9.tmp.regSelect.all.filter(value=>!s.includes(value));
}

%}


%% /* language grammar */

select
    : exp EOF
        {JS9.tmp.regSelect.ids = $1; return $1;}
    ;


exp
    : WORD
        {$$ = jisonSelect($1);}
    | DSTRING
        // for use of unicode, see https://github.com/zaach/jison/issues/380
        {$$ = jisonSelect($1.replace(/^"(.+(?="$))"$/, '\u00241'));}
    | SSTRING
        {$$ = jisonSelect($1.replace(/^'(.+(?='$))'$/, '\u00241'));}
    | REGEXP
        {$$ = jisonSelect($1);}
    | exp 'AND' exp
        {$$ = jisonAnd($1,$3);}
    | exp 'OR' exp
        {$$ = jisonOr($1,$3);}
    | NOT exp
        {$$ = jisonNot($2);}
    | '(' exp ')'
        {$$ = $2;}
    ;

