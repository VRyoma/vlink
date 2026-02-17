'use client';

import React from 'react';
import { parse } from 'mfm-js';

// Define a minimal interface if mfm-js types aren't playing nice, 
// but mfm-js usually exports MfmNode. Let's try to infer or use any for safety first.
// The actual structure is consistent.

const MfmNodeRenderer = ({ node }: { node: any }) => {
  if (node.type === 'text') {
    return <>{node.props.text}</>;
  }

  if (node.type === 'bold') {
    return <strong className="font-bold">{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</strong>;
  }

  if (node.type === 'italic') {
    return <em className="italic">{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</em>;
  }

  if (node.type === 'strike') {
    return <s className="line-through">{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</s>;
  }

  if (node.type === 'link') {
    return (
      <a href={node.props.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
        {node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}
      </a>
    );
  }

  if (node.type === 'fn') {
    const fnName = node.props.name;
    let className = '';
    
    // Simple mapping to CSS classes defined in globals.css
    switch (fnName) {
      case 'shake':
        className = 'mfm-shake';
        break;
      case 'rainbow':
        className = 'mfm-rainbow'; // Note: applies to text color usually
        break;
      case 'tada':
        className = 'mfm-tada';
        break;
      case 'bounce':
        className = 'mfm-bounce';
        break;
      case 'jelly':
         // jelly is similar to tada/bounce, let's map to bounce for now or add more keyframes
         className = 'mfm-bounce';
         break;
      default:
        break;
    }

    if (className) {
      // For block-level effects like shake, we use inline-block.
      // For text color effects like rainbow, span is fine.
      return (
        <span className={className}>
          {node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}
        </span>
      );
    }
  }

  if (node.type === 'small') {
      return <small className="text-sm opacity-80">{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</small>;
  }
  
  if (node.type === 'center') {
      return <div className="text-center w-full">{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</div>;
  }

  // Fallback: render children directly
  if (node.children) {
    return <>{node.children.map((child: any, i: number) => <MfmNodeRenderer key={i} node={child} />)}</>;
  }

  return null;
};

export default function MfmRenderer({ text, className }: { text: string, className?: string }) {
  // Parse MFM text into AST
  const nodes = parse(text);

  return (
    <div className={`whitespace-pre-wrap break-words ${className || ''}`}>
      {nodes.map((node: any, i: number) => (
        <MfmNodeRenderer key={i} node={node} />
      ))}
    </div>
  );
}
