import React from 'react';
import '../styles/AttributeCallButtons.css';
import { FEATURE_SETS } from './views/FlexWindow';

const AttributeCallButtons = ({ activeFeatureSet, setActiveFeatureSet }) => {
  const handleAttributeCall = (featureSetKey) => {
    if (setActiveFeatureSet) {
      setActiveFeatureSet(featureSetKey);
    }
  };

  return (
    <div className="attribute-call-buttons">
      <div className="attribute-call-header">
        <span className="attribute-call-title">Attributes</span>
      </div>

      <div className="attribute-buttons-grid">
        {Object.entries(FEATURE_SETS).map(([key, featureSet]) => (
          <button
            key={key}
            className={`attribute-call-btn ${activeFeatureSet === key ? 'active' : ''}`}
            onClick={() => handleAttributeCall(key)}
            title={`Load ${featureSet.label} parameters`}
          >
            <span className="attr-icon">{featureSet.icon}</span>
            <span className="attr-label">{featureSet.label}</span>
          </button>
        ))}

        <button
          className={`attribute-call-btn ${activeFeatureSet === 'all' ? 'active' : ''}`}
          onClick={() => handleAttributeCall('all')}
          title="Show all parameters"
        >
          <span className="attr-icon">📋</span>
          <span className="attr-label">All</span>
        </button>
      </div>

      <div className="attribute-call-info">
        Click to load attribute parameters into Programmer
      </div>
    </div>
  );
};

export default AttributeCallButtons;
