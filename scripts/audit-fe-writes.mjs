// Source inventory only: never calls application APIs or reads environment files.
import ts from 'typescript';
import { readdirSync,readFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { join,relative,resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):[join(dir,entry.name)]);}
const writes=[],localWrites=[],socketWrites=[];
const scanned=files(join(root,'src')).filter(file=>/\.tsx?$/.test(file));
for(const file of scanned){
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function walk(node){
  if(ts.isCallExpression(node)){
   const callee=node.expression.getText(source);
   const entry={file:relative(root,file).replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,callee};
   if(/\.(post|put|patch|delete)$/.test(callee))writes.push({...entry,path:node.arguments[0]?.getText(source),bodyKeys:node.arguments[1]&&ts.isObjectLiteralExpression(node.arguments[1])?node.arguments[1].properties.map(property=>property.name?.getText(source)||'...spread'):undefined});
   else if(callee==='request'&&node.arguments[0]&&/['"](POST|PUT|PATCH|DELETE)['"]/.test(node.arguments[0].getText(source)))writes.push({...entry,method:node.arguments[0].getText(source),path:node.arguments[1]?.getText(source)});
   if(/(?:localStorage|sessionStorage)\.(setItem|removeItem)$/.test(callee))localWrites.push({...entry,key:node.arguments[0]?.getText(source)});
   if(/\.emit$/.test(callee)&&/send_message|message|invite/.test(node.arguments[0]?.getText(source)||''))socketWrites.push({...entry,event:node.arguments[0]?.getText(source)});
  }
  ts.forEachChild(node,walk);
 }
 walk(source);
}
const result={note:'Static inventory, not end-to-end proof of persistence; includes legacy and unreachable components. Review active routes and backend DTO/service code separately.',sourceFilesScanned:scanned.length,httpWriteCalls:writes.length,localWriteCalls:localWrites.length,socketWriteCalls:socketWrites.length,writes,localWrites,socketWrites};
mkdirSync(join(root,'.qa-artifacts/persistence-audit'),{recursive:true});
writeFileSync(join(root,'.qa-artifacts/persistence-audit/source-inventory.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sourceFilesScanned:scanned.length,httpWriteCalls:writes.length,localWriteCalls:localWrites.length,socketWriteCalls:socketWrites.length}));
