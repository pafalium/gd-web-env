
import {combineReducers} from 'redux';

import {time} from '../utils/time.js';

const nullProgram = {name: 'untitled', program: ''};

import {examples as examplePrograms} from '../example-programs/examples.js';

import {runInCad, clearCad, selectCads} from '../Runner/run-in-cad.js';

// .d8888b.           888                   888                             
//d88P  Y88b          888                   888                             
//Y88b.               888                   888                             
// "Y888b.    .d88b.  888  .d88b.   .d8888b 888888 .d88b.  888d888 .d8888b  
//    "Y88b. d8P  Y8b 888 d8P  Y8b d88P"    888   d88""88b 888P"   88K      
//      "888 88888888 888 88888888 888      888   888  888 888     "Y8888b. 
//Y88b  d88P Y8b.     888 Y8b.     Y88b.    Y88b. Y88..88P 888          X88 
// "Y8888P"   "Y8888  888  "Y8888   "Y8888P  "Y888 "Y88P"  888      88888P' 
//                                                                          
//                                                                          
//                                                                          
function activeCads(state) {
  return state.exportCads;
}


//8888888888                                    888    
//888                                           888    
//888                                           888    
//8888888    888  888 88888b.   .d88b.  888d888 888888 
//888        `Y8bd8P' 888 "88b d88""88b 888P"   888    
//888          X88K   888  888 888  888 888     888    
//888        .d8""8b. 888 d88P Y88..88P 888     Y88b.  
//8888888888 888  888 88888P"   "Y88P"  888      "Y888 
//                    888                              
//                    888                              
//                    888                              

/**
  Actions
 */
const SET_EXPORT_CADS = 'SET_EXPORT_CADS';
const EXPORT_TO_CADS = 'EXPORT_TO_CADS';
const CLEAR_EXPORT_CADS = 'CLEAR_EXPORT_CADS';

const EXPORT_DONE = 'EXPORT_DONE'; // Not following the imperative mood...
const EXPORT_FAILED = 'EXPORT_FAILED';

/**
  Action creators
 */
export function setExportCads(exportCads) {
  return {
    type: SET_EXPORT_CADS,
    exportCads
  };
}

function exportToCads() {
  return {
    type: EXPORT_TO_CADS
  };
}

function clearCads() {
  return {
    type: CLEAR_EXPORT_CADS
  };
}

export function doExportToCads() {
  return (dispatch, getState) => {
    dispatch(exportToCads());
    setTimeout(() => {
      try {
        selectCads(getState().exportCads);
        time("CAD export", ()=>runInCad(getState().activeProgram.program));
        dispatch({
          type: EXPORT_DONE
        });
      } catch (e) {
        dispatch({
          type: EXPORT_FAILED,
          error: e
        });
      }
    }, 0);
  };
}

export function doClearCads() {
  return (dispatch, getState) => {
    dispatch(clearCads());
    setTimeout(() => {
      try {
        selectCads(getState().exportCads);
        clearCad();
        dispatch({
          type: EXPORT_DONE
        });
      } catch (e) {
        dispatch({
          type: EXPORT_FAILED,
          error: e
        });
      }
    }, 0);
  }
}


/**
 Reducers 
 */
function availableCads(state = ['autocad', 'sketchup'], action = {}) {
  switch (action.type) {
    default:
      return state;
  }
}

function exportCads(state = [], action = {}) {
  switch (action.type) {
    case SET_EXPORT_CADS:
      return action.exportCads;
    default:
      return state;
  }
}

function exportingToCAD(state = false, action = {}) {
  switch (action.type) {
    case EXPORT_TO_CADS:
    case CLEAR_EXPORT_CADS:
      return true;
    case EXPORT_DONE:
    case EXPORT_FAILED:
      return false;
    default:
      return state;
  }
}



//8888888b.                                                                  
//888   Y88b                                                                 
//888    888                                                                 
//888   d88P 888d888 .d88b.   .d88b.  888d888 8888b.  88888b.d88b.  .d8888b  
//8888888P"  888P"  d88""88b d88P"88b 888P"      "88b 888 "888 "88b 88K      
//888        888    888  888 888  888 888    .d888888 888  888  888 "Y8888b. 
//888        888    Y88..88P Y88b 888 888    888  888 888  888  888      X88 
//888        888     "Y88P"   "Y88888 888    "Y888888 888  888  888  88888P' 
//                                888                                        
//                           Y8b d88P                                        
//                            "Y88P"                                         

/**
  Program management logic module.
 */

/**
  Actions
 */
const CREATE_PROGRAM = 'CREATE_PROGRAM';
const SAVE_PROGRAM = 'SAVE_PROGRAM';

const SELECT_PROGRAM = 'SELECT_PROGRAM'; // Change the active program
const CHANGE_PROGRAM = 'CHANGE_PROGRAM'; // Make a change to the program's source code

/**
  Action creators
 */
export function createProgram(name, source = '') {
  return {
    type: CREATE_PROGRAM,
    name,
    source
  };
}

export function selectProgram(name, program) {
  return {
    type: SELECT_PROGRAM,
    name,
    program
  };
}

export function changeProgram(program) {
  return {
    type: CHANGE_PROGRAM,
    program
  };
}

/**
 Reducers 
 */
function programs(state = examplePrograms, action = {}) {
  switch (action.type) {
      // Do program storage stuff.
    case CREATE_PROGRAM:
      return [
        {name: action.name, program: action.source},
        ...examplePrograms
      ];
    case SAVE_PROGRAM:
      return [
        {name: action.name, program: action.program},
        ...state.filter(({name}) => name !== action.name)
      ];
    default:
      return state;
  }
}

function activeProgram(state = nullProgram, action = {}) {
  switch (action.type) {
    case SELECT_PROGRAM:
      return {
        name: action.name,
        program: action.program
      };
    case CHANGE_PROGRAM:
      return {
        name: state.name, 
        program: action.program
      };
    default:
      return state;
  }
}




//8888888888     888 d8b 888                    
//888            888 Y8P 888                    
//888            888     888                    
//8888888    .d88888 888 888888 .d88b.  888d888 
//888       d88" 888 888 888   d88""88b 888P"   
//888       888  888 888 888   888  888 888     
//888       Y88b 888 888 Y88b. Y88..88P 888     
//8888888888 "Y88888 888  "Y888 "Y88P"  888     
//                                              
//                                              
//                                              

 /**
  Program editing logic.
  */
  
const REQUEST_PROGRAM_RUN = 'REQUEST_PROGRAM_RUN';
const PROGRAM_RUN_SUCCESS = 'PROGRAM_RUN_SUCCESS';
const PROGRAM_RUN_ERROR = 'PROGRAM_RUN_ERROR';
const PROGRAM_RUN_TIMEOUT = 'PROGRAM_RUN_TIMEOUT';


function runningStatus(state = 'idle', action = {}) {
  switch (action.type) {
      // 
    default:
      return state;
  }
}

function activeProgramResults(state = null, action = {}) {
  switch (action.type) {

    default:
      return state;
  }
}




// .d8888b.                         888      8888888b.               888          
//d88P  Y88b                        888      888   Y88b              888          
//888    888                        888      888    888              888          
//888         .d88b.  88888b.d88b.  88888b.  888   d88P .d88b.   .d88888 888  888 
//888        d88""88b 888 "888 "88b 888 "88b 8888888P" d8P  Y8b d88" 888 888  888 
//888    888 888  888 888  888  888 888  888 888 T88b  88888888 888  888 888  888 
//Y88b  d88P Y88..88P 888  888  888 888 d88P 888  T88b Y8b.     Y88b 888 Y88b 888 
// "Y8888P"   "Y88P"  888  888  888 88888P"  888   T88b "Y8888   "Y88888  "Y88888 
//                                                                                
//                                                                                
//                                                                                

export default combineReducers({
  availableCads,
  exportCads,
  exportingToCAD,
  programs,
  activeProgram,
  activeProgramResults,
  runningStatus,
});

