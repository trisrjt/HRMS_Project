import React, { useState, useEffect } from 'react';

const FaceEnrollment = ({ email, onFaceEnrolled, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      if (window.faceapi && !modelsLoaded) {
        try {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setModelsLoaded(true);
        } catch (err) {
          console.error('Error loading face-api models:', err);
          setError('Failed to load face recognition models');
        }
      }
    };
    
    if (window.faceapi) {
      loadModels();
    } else {
      const checkInterval = setInterval(() => {
        if (window.faceapi) {
          clearInterval(checkInterval);
          loadModels();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, [modelsLoaded]);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        setStream(mediaStream);
        
        // Attach stream to video element
        const video = document.getElementById('enrollFaceVideo');
        if (video) {
          video.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attach stream to video when it becomes available
  useEffect(() => {
    const video = document.getElementById('enrollFaceVideo');
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = async () => {
    if (!stream || !modelsLoaded) {
      setError('Face recognition system is still loading. Please wait...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const video = document.getElementById('enrollFaceVideo');
      
      // Detect face and extract descriptor
      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        setError('No face detected. Please position your face in the center.');
        setIsLoading(false);
        return;
      }
      
      // Get face descriptor (128-dimensional vector)
      const descriptor = Array.from(detection.descriptor);
      
      // Capture image for visual verification
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      // Return descriptor and image
      onFaceEnrolled(descriptor, blob);
    } catch (err) {
      console.error('Face enrollment error:', err);
      setError('Failed to capture face. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 100px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Enroll Employee Face
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              {email} - Position face in the center
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '24px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Video Feed */}
        <div style={{ padding: '24px', background: '#000', position: 'relative' }}>
          <video
            id="enrollFaceVideo"
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: '400px',
              borderRadius: '12px',
              objectFit: 'cover',
            }}
          />
          
          {/* Face Detection Overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '360px',
            border: '3px solid rgba(139, 92, 246, 0.8)',
            borderRadius: '50%',
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
          }} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 24px',
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {error && (
            <div style={{
              marginBottom: '12px',
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCapture}
              disabled={isLoading || !modelsLoaded}
              style={{
                flex: 1,
                padding: '14px 24px',
                borderRadius: '10px',
                border: 'none',
                background: isLoading || !modelsLoaded 
                  ? 'linear-gradient(135deg, #9ca3af, #9ca3af)'
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: isLoading || !modelsLoaded ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Capturing...' : (!modelsLoaded ? 'Loading...' : 'Capture Face')}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '14px 24px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollment;
