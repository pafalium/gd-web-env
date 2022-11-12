

export const IconButton = ({icon, onClick}) => (
  <img className="icon-button" onClick={onClick} src={icon}/>
);


export const Checkbox = ({label, checked, onClick}) => (
  <label className='checkbox' onChange={onClick}>
    <input type='checkbox' checked={checked}/>
    <span>{label}</span>
  </label>
);
