Query
  = OR
  
OR
  = left:AND _ ('OR'/'or') _ right:OR {
    return {  type: 'compound', operator: 'OR', left, right }
  }
  / AND
  
AND
  = left:Comparison _ ('AND'/'and') _ right:AND {
    return { type: 'compound', operator: 'AND', left, right }
  }
  / ImplicitAnd / Comparison

ImplicitAnd
  = first:Comparison rest:(_ Comparison)* {
    let result = first;
    for (const [_, comp] of rest) {
      result = { type: 'compound', operator: 'AND', left: result, right: comp };
    }
    return result;
  }

Comparison
  = left:Key _ operator:Operator _ right:Value {
     return { type: 'comparison', operator, left, right }
   }
  / "(" _ exp:Query _ ")" {
     return exp;
   }

Operator
  = '=' 
	/ '!=' 
	/ ':' 
	/ '!:' 
	/ '>' 
	/ '>=' 
	/ '<' 
	/ '<='

Identifier
  = chars:[a-zA-Z0-9_]+ {
    return chars.join('')
  }
  
DotSegment
  = "." identifier:Identifier {
      return "." + identifier
    }
  
Key
  = first:Identifier rest:DotSegment* {
  	return first + rest.join('')
  }
  
Value
  = Identifier / Integer / String

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

String
  = "\"" chars:[^\"] * "\"" {
      return chars.join('');
    }

_ "whitespace"
  = [ \t\n\r]*