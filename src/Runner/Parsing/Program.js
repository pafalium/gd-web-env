
import esprima from 'esprima';
import escodegen from 'escodegen';

// TODO Define the model of the programs.
/*
  Immutable data structures?
    This would be cool and enforce that programs are values.
  Understand comments and integrate them in the representations.
  How to support text and structural editing?
    Keep only one representation?
    Keep both representations and keep them in sync?
    In the end there is always a valid structure.
    Only syntactically correct programs can be objects of these classes?
      Intermediate versions belong to different classes?
      Intermediate versions are handled by UI?
        Text fragments -> validate -> Program fragments
  Have a wrapper, a facade, for working with programs?
  Program
    Script
  How does the running algorithm and programs communicate?
    Running algorithm queries program about ast
    Running algorithm creates a new program with some modifications from the original
      Basically it would be a map over the program which creates a new program that is the one that will be evaluated.
      In most cases, it does have to collect some information before actually creating the new program.
  How is the running algorithm used?
    It is used to know things about the program that only become available when it runs.
      The results it generates.
      The entire execution control flow.
      The entire execution data flow.
  What can we know by looking at a program?
    The variable scoping information.
    The functions it uses, both in expression and declaration form.
    Partial information about control flow and data flow.
    How it should be run.
    We can infer types.
*/

function sourceToAst(sourceCode) {
  let ast = esprima.parse(sourceCode, {loc: true, comment: true});
  return ast;
}


const codeToAst = new Map();

function memoizedSourceToAst(sourceCode) {
  if (codeToAst.has(sourceCode)) {
    return codeToAst.get(sourceCode);
  } else {
    let ast = sourceToAst(sourceCode);
    codeToAst.set(sourceCode, ast);
    return ast;
  }
}

export {memoizedSourceToAst as sourceToAst};


export function validSource(sourceCode) {
  try {
    sourceToAst(sourceCode);
    return true;
  } catch (e) {
    return false;
  }
}

export function astToSource(ast) {
  return escodegen.generate(ast);
}
