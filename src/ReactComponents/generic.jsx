import React, {Children} from 'react';


export const ColumnSplit = ({children, height = '100%'}) => (
  <div className='column-split' style={{height}}>
    {Children.map(children, c => 
      <div style={{width: 100/Children.count(children) + '%', height: '100%'}}>
        {c}
      </div>
    )}
  </div>
);

export const RowSplit = ({children}) => (
  <div className='row-split'>
    {children}
  </div>
);

export const HorizontalBar = ({children}) => (
  <div className='horizontal-bar'>
    <div>{children}</div>
  </div>
);

export const Checkbox = ({label, checked, onClick}) => (
  <label className='checkbox' onChange={onClick}>
    <input type='checkbox' checked={checked}/>
    <span>{label}</span>
  </label>
);


export const VerticalIconBar = ({children}) => (
  <div className="vertical-icon-bar">
    {children}
  </div>
);

export const Spacer = ({width, height}) => (
  <div style={{width, height}}/>
);

export const IconButton = ({icon, onClick}) => (
  <img className="icon-button" onClick={onClick} src={icon}/>
);

export const Drawer = ({open, children}) => (
  <div className="drawer" style={{display: open ? 'block' : 'none'}}>
    {children}
  </div>
);


