import "./InfoBlock.scss"
import React from 'react'
import {useUtils} from "/src/helpers/utils.js"
import ImageView from "/src/components/generic/ImageView.jsx"
import FaIcon from "/src/components/generic/FaIcon.jsx"

const utils = useUtils()

function InfoBlock({ img, faIcon, faIconColors, html, links = [] }) {
    const href = links.length > 0 ? links[0].href : null
  
    const blockContent = (
      <>
        {(img || faIcon) && (
          <InfoBlockImageCol 
            img={img} 
            fallbackIcon={faIcon} 
            fallbackIconColors={faIconColors} 
          />
        )}
        <InfoBlockTextCol html={html} />
      </>
    )
  
    return href ? (
      <a
        className="info-block"
        href={href}
        target="_blank"    // Always open in new tab
        rel="noopener noreferrer"
      >
        {blockContent}
      </a>
    ) : (
      <div className="info-block">{blockContent}</div>
    )
  }


function InfoBlockImageCol({ img, fallbackIcon, fallbackIconColors }) {
  return (
    <div className="info-block-image-col">
      {img ? (
        <ImageView src={img} alt="logo" />
      ) : (
        <FaIcon iconName={fallbackIcon} className="display-6" colors={fallbackIconColors} />
      )}
    </div>
  )
}

function InfoBlockTextCol({ html }) {
  return (
    <div className="info-block-text-col">
      <span
        className="text-4"
        dangerouslySetInnerHTML={{ __html: utils.parseJsonText(html) }}
      />
    </div>
  )
}

export default InfoBlock

