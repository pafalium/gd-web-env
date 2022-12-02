
import {createSlice} from '@reduxjs/toolkit';

import {time} from '../utils/time.js';
import {runInCad, clearCad, selectCads} from '../Runner/run-in-cad.js';

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

const exportToCadSlice = createSlice({
  name: 'exportToCad',
  initialState: {
    availableCads: ['autocad', 'sketchup'],
    exportCads: [],
    exportingToCads: false
  },
  reducers: {
    setAvailableCads(state, action) {
      state.availableCads = action.payload
    },
    setExportCads(state, action) {
      state.exportCads = action.payload
    },
    beginExport(state) {
      state.exportingToCads = true
    },
    endExportDone(state, action) {
      state.exportingToCads = false
    },
    endExportFailed(state, action) {
      state.exportingToCads = false
      console.error('export failure', action.payload.error)
    }
  }
})



export const {
  setAvailableCads,
  setExportCads,
  beginExport,
  endExportDone,
  endExportFailed
} = exportToCadSlice.actions;

export default exportToCadSlice;



export const doExportToCads = () => (dispatch, getState) => {
  dispatch(beginExport());
  setTimeout(() => {
    try {
      selectCads(selectExportCads(getState()));
      time("CAD export", ()=>runInCad(selectActiveProgram(getState()).program));
      dispatch(endExportDone())
    } catch (e) {
      dispatch(endExportFailed(e))
    }
  }, 0);
}
export const doClearCads = () => (dispatch, getState) => {
  dispatch(beginExport());
  setTimeout(() => {
    try {
      selectCads(selectExportCads(getState()));
      clearCad();
      dispatch(endExportDone());
    } catch (e) {
      dispatch(endExportFailed(e));
    }
  }, 0);
}
