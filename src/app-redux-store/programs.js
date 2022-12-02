
import {createSlice} from '@reduxjs/toolkit';

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

const NULL_PROGRAM = {name: 'untitled', program: ''};

const programsSlice = createSlice({
  name: 'programs',
  initialState: {
    allPrograms: [],
    activeProgram: NULL_PROGRAM
  },
  reducers: {
    createProgram(state, action) {
      state.allPrograms.push({
        name: action.payload.name, 
        source: action.payload.source
      });
    },
    saveProgram(state, action) {
      let program = state.allPrograms
      .find(({name}) => name==action.payload.name);
      program.source = action.payload.source;
    },
    //aka -> selectProgram()
    setActiveProgram(state, action) {
      state.activeProgram = {
        name: action.payload.name,
        program: action.payload.program
      };
    },
    //aka -> changeProgram()
    updateActiveProgram(state, action) {
      state.activeProgram.program = action.payload.program;
    }
  }
})



export const {
  createProgram,
  saveProgram,
  setActiveProgram,
  updateActiveProgram
} = programsSlice.actions;

export default programsSlice;
