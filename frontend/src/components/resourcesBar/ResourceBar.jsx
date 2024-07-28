import useStore from "../../context/mainStore";
import "./resourceBar.css";

const ResourceBar = () => {
  const { gold, goldPerSecond } = useStore();

  return (
    <div className="resourceBar">
      <div className="d-flex gap-3 justify-content-start">
        <h6>🪙Gold: {gold}</h6>
        <h6>🪙Gold per second: {goldPerSecond}</h6>
      </div>
    </div>
  );
};

export default ResourceBar;
