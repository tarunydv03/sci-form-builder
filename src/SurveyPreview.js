// src/SurveyPreview.js
import React, { useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";

export function SurveyPreview({ surveyJson, initialData = {}, onSurveyComplete, onSurveyDataChange }) {
  const surveyModelRef = useRef(null);
  const [filePreviews, setFilePreviews] = useState({});

  // Helper function to create image preview component
  const createImagePreview = (fileName, base64Content, fileSize) => {
    return {
      type: 'image',
      fileName,
      base64Content,
      fileSize,
      sizeText: `${Math.round(fileSize / 1024)} KB`
    };
  };

  const createAudioPreview = (fileName, base64Content, fileSize) => {
    return {
      type: 'audio',
      fileName,
      base64Content,
      fileSize,
      sizeText: `${Math.round(fileSize / 1024)} KB`
    };
  };

  const createDocumentPreview = (fileName, fileType, fileSize) => {
    const getFileIcon = (type) => {
      if (type.includes('pdf')) return '📄';
      if (type.includes('doc') || type.includes('word')) return '📝';
      if (type.includes('excel') || type.includes('sheet')) return '📊';
      if (type.includes('text') || type.includes('txt')) return '📃';
      if (type.includes('zip') || type.includes('rar')) return '📦';
      return '📎';
    };

    const getFileTypeText = (type, name) => {
      if (type.includes('pdf')) return 'PDF Document';
      if (type.includes('doc') || type.includes('word')) return 'Word Document';
      if (type.includes('excel') || type.includes('sheet')) return 'Excel Spreadsheet';
      if (type.includes('text') || type.includes('txt')) return 'Text File';
      if (name.toLowerCase().includes('.epub')) return 'eBook (EPUB)';
      if (name.toLowerCase().includes('.mobi')) return 'eBook (MOBI)';
      return 'Document';
    };

    return {
      type: 'document',
      fileName,
      fileType,
      fileSize,
      icon: getFileIcon(fileType),
      typeText: getFileTypeText(fileType, fileName),
      sizeText: `${Math.round(fileSize / 1024)} KB`
    };
  };

  // Create survey model with enhanced configuration
  const createSurveyModel = () => {
    const model = new Model(surveyJson);
    
    // Configure survey settings for better XLS form compatibility
    model.showProgressBar = "bottom";
    model.showQuestionNumbers = "onPage";
    model.questionsOnPageMode = "singlePage";
    model.checkErrorsMode = "onValueChanged";
    model.textUpdateMode = "onBlur";
    model.clearInvisibleValues = "onHidden";
    model.focusFirstQuestionAutomatic = false;
    
    // Set initial data if provided
    if (Object.keys(initialData).length > 0) {
      model.data = initialData;
    }
    
    // Enhanced completion handler
    model.onComplete.add((sender) => {
      const results = sender.data;
      console.log("Survey completed with data:", results);
      onSurveyComplete(results);
    });

    // Add data change handler to preserve answers
    model.onValueChanged.add((sender, options) => {
      const { name, value } = options;
      
      // Notify parent component of data changes
      if (onSurveyDataChange) {
        onSurveyDataChange(sender.data);
      }
      
      // Handle dynamic panel count changes
      if (name === "children_count" && value > 0) {
        const childrenPanel = sender.getQuestionByName("children_details");
        if (childrenPanel && childrenPanel.getType() === "paneldynamic") {
          childrenPanel.panelCount = parseInt(value) || 0;
        }
      }
      
      if (name === "household_size" && value > 0) {
        const householdPanel = sender.getQuestionByName("household_members");
        if (householdPanel && householdPanel.getType() === "paneldynamic") {
          householdPanel.panelCount = parseInt(value) || 0;
        }
      }

      // Handle nested dynamic panels for assets
      if (name.includes("asset_count")) {
        const householdPanel = sender.getQuestionByName("household_members");
        if (householdPanel && householdPanel.panels) {
          householdPanel.panels.forEach((panel, index) => {
            const assetCountKey = `household_members[${index}].asset_count`;
            const assetCount = sender.getValue(assetCountKey);
            if (assetCount && assetCount > 0) {
              const assetPanel = panel.getQuestionByName("member_assets");
              if (assetPanel && assetPanel.getType() === "paneldynamic") {
                assetPanel.panelCount = parseInt(assetCount) || 0;
              }
            }
          });
        }
      }

      // Enhanced choice filtering logic
      if (name === "country") {
        const cityQuestion = sender.getQuestionByName("city");
        if (cityQuestion) {
          sender.setValue("city", undefined);
          cityQuestion.clearIncorrectValues();
        }
      }

      // Log value changes for debugging
      if (console.groupCollapsed) {
        console.groupCollapsed(`Survey Value Changed: ${name}`);
        console.log('New value:', value);
        console.log('All data:', sender.data);
        console.groupEnd();
      }
    });

    // Enhanced file upload handler with React state-based preview
    model.onUploadFiles.add((sender, options) => {
      const files = options.files;
      const question = options.question;
      
      if (files.length > 0) {
        const file = files[0];
        
        // Check file size
        const maxSize = question.maxSize || 5242880; // 5MB default
        if (file.size > maxSize) {
          options.callback("error", {
            error: `File size exceeds limit of ${Math.round(maxSize / 1048576)}MB`
          });
          return;
        }
        
        // Check file type if specified
        const acceptedTypes = question.acceptedTypes;
        if (acceptedTypes && !acceptedTypes.includes(file.type) && !acceptedTypes.includes(file.name.split('.').pop())) {
          const isImageType = acceptedTypes.includes('image/*') && file.type.startsWith('image/');
          const isAudioType = acceptedTypes.includes('audio/*') && file.type.startsWith('audio/');
          const isDocumentType = acceptedTypes.includes('.pdf') && file.type === 'application/pdf';
          
          if (!isImageType && !isAudioType && !isDocumentType) {
            options.callback("error", {
              error: `File type not allowed. Accepted types: ${acceptedTypes}`
            });
            return;
          }
        }
        
        // Convert file to base64 for preview/storage
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64Content = e.target.result;
          
          // Create enhanced file result object
          const fileResult = {
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64Content
          };
          
          // Add preview data to React state
          let previewData;
          if (file.type.startsWith('image/')) {
            previewData = createImagePreview(file.name, base64Content, file.size);
          } else if (file.type.startsWith('audio/')) {
            previewData = createAudioPreview(file.name, base64Content, file.size);
          } else {
            previewData = createDocumentPreview(file.name, file.type, file.size);
          }
          
          // Update preview state
          setFilePreviews(prev => ({
            ...prev,
            [question.name]: previewData
          }));
          
          console.log(`File uploaded for question ${question.name}:`, {
            name: file.name,
            type: file.type,
            size: `${Math.round(file.size / 1024)} KB`
          });
          
          // Success callback
          options.callback("success", fileResult);
        };
        
        reader.onerror = function() {
          options.callback("error", {
            error: "Failed to read file"
          });
        };
        
        reader.readAsDataURL(file);
      } else {
        options.callback("error", {
          error: "No file selected"
        });
      }
    });

    // Handle file removal with preview cleanup
    model.onClearFiles.add((sender, options) => {
      const question = options.question;
      console.log(`Files cleared for question: ${question.name}`);
      
      // Remove preview from state
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[question.name];
        return newPreviews;
      });
      
      options.callback("success");
    });

    model.onValidateQuestion.add((sender, options) => {
      console.log(`Validating question: ${options.name}`);
    });

    model.onDynamicPanelAdded.add((sender, options) => {
      console.log(`Panel added to ${options.question.name}`);
    });

    model.onDynamicPanelRemoved.add((sender, options) => {
      console.log(`Panel removed from ${options.question.name}`);
    });

    // Store reference for cleanup
    surveyModelRef.current = model;
    
    return model;
  };

  const surveyModel = createSurveyModel();

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (surveyModelRef.current) {
        surveyModelRef.current = null;
      }
    };
  }, []);

  // Custom component to render file previews
  const FilePreviewComponent = ({ questionName, preview }) => {
    if (!preview) return null;

    const previewStyle = {
      marginTop: '15px',
      padding: '15px',
      border: '1px solid #d4edda',
      borderRadius: '8px',
      backgroundColor: '#f8fff9'
    };

    const headerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
      fontSize: '14px'
    };

    const titleStyle = {
      fontWeight: 'bold',
      color: '#28a745'
    };

    const infoStyle = {
      color: '#6c757d',
      fontSize: '12px'
    };

    if (preview.type === 'image') {
      return (
        <div style={previewStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>📷 Image Preview</span>
            <span style={infoStyle}>{preview.fileName} ({preview.sizeText})</span>
          </div>
          <div>
            <img 
              src={preview.base64Content} 
              alt={preview.fileName} 
              style={{
                maxWidth: '300px',
                maxHeight: '200px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'block',
                margin: '0 auto'
              }} 
            />
          </div>
        </div>
      );
    }

    if (preview.type === 'audio') {
      return (
        <div style={previewStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>🎵 Audio Preview</span>
            <span style={infoStyle}>{preview.fileName} ({preview.sizeText})</span>
          </div>
          <div>
            <audio 
              controls 
              style={{ width: '100%', margin: '10px 0' }}
            >
              <source src={preview.base64Content} type="audio/*" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }

    if (preview.type === 'document') {
      return (
        <div style={previewStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>{preview.icon} {preview.typeText} Uploaded</span>
            <span style={infoStyle}>({preview.sizeText})</span>
          </div>
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '15px', 
              borderRadius: '6px', 
              border: '1px solid #dee2e6',
              display: 'inline-block',
              minWidth: '250px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {preview.icon}
              </div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '5px',
                wordBreak: 'break-word',
                color: '#495057'
              }}>
                {preview.fileName}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6c757d',
                marginBottom: '5px'
              }}>
                {preview.typeText}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#868e96'
              }}>
                File Size: {preview.sizeText}
              </div>
            </div>
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              color: '#28a745',
              fontWeight: '500'
            }}>
              ✅ File successfully uploaded
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="survey-container">
      <Survey model={surveyModel} />
      
      {/* Render file previews */}
      {Object.entries(filePreviews).map(([questionName, preview]) => (
        <div key={questionName}>
          <FilePreviewComponent questionName={questionName} preview={preview} />
        </div>
      ))}
      
      <style jsx>{`
        .survey-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #eafaf1;
        }

        /* Custom styling for better UX */
        .sv-question__title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #218838;
        }

        .sv-panel__title {
          background-color: #d4edda;
          padding: 12px 20px;
          border-left: 4px solid #28a745;
          margin-bottom: 15px;
          color: #155724;
          border-radius: 7px 7px 0 0;
          font-size: 16px;
        }

        .sv-paneldynamic__panel {
          border: 1px solid #c3e6cb;
          border-radius: 6px;
          margin-bottom: 15px;
          padding: 20px;
          background-color: #f6fff9;
          box-shadow: 0 1px 3px rgba(40,167,69,0.05);
        }

        .sv-paneldynamic__panel-title {
          background-color: #d4edda;
          color: #218838;
          padding: 8px 15px;
          border-radius: 4px;
          font-weight: 600;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .sv-question--file .sv-question__content {
          border: 2px dashed #c3e6cb;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          background: #eafaf1;
          transition: all 0.3s ease;
        }

        .sv-question--file .sv-question__content:hover {
          border-color: #28a745;
          background: #d4edda;
        }

        .sv-rating {
          margin: 15px 0;
        }

        .sv-rating__item {
          margin: 0 5px;
          padding: 8px 12px;
          border-radius: 5px;
          transition: all 0.3s ease;
        }

        .sv-rating__item:hover {
          background: #d4edda;
        }

        .sv-rating__item--selected {
          background: #28a745;
          color: white;
        }

        .sv-matrix th {
          background-color: #d4edda;
          font-weight: 600;
          color: #218838;
        }

        .sv-matrix td {
          padding: 10px;
        }

        /* Progress Bar */
        .sv-progress {
          background: linear-gradient(90deg, #28a745, #a8e063);
          height: 6px;
          border-radius: 3px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .sv-question {
            margin-bottom: 20px;
          }

          .sv-paneldynamic__panel {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}