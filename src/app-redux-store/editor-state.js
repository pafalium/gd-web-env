
import {configureStore} from '@reduxjs/toolkit';

import programsSlice from './programs.js';
import exportToCadSlice from './export-to-cad.js';
                                                                               


export default configureStore({
  reducer: {
    programs: programsSlice.reducer,
    exportToCad: exportToCadSlice.reducer,
  }
});


// .d8888b.           888                   888                             
//d88P  Y88b          888                   888                             
//Y88b.               888                   888                             
// "Y888b.    .d88b.  888  .d88b.   .d8888b 888888 .d88b.  888d888 .d8888b  
//    "Y88b. d8P  Y8b 888 d8P  Y8b d88P"    888   d88""88b 888P"   88K      
//      "888 88888888 888 88888888 888      888   888  888 888     "Y8888b. 
//Y88b  d88P Y8b.     888 Y8b.     Y88b.    Y88b. Y88..88P 888          X88 
// "Y8888P"   "Y8888  888  "Y8888   "Y8888P  "Y888 "Y88P"  888      88888P' 



/* Export-to-CAD */
//aka -> activeCads()
export function selectExportCads(state) {
  return state.exportToCad.exportCads;
}
export function selectAvailableCads(state) {
  return state.exportToCad.availableCads;
}


/* Programs */

export function selectActiveProgram(state) {
  return state.programs.activeProgram;
}
export function selectSavedPrograms(state) {
  return state.programs.allPrograms;
}
