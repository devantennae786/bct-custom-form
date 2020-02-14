import { css } from 'astroturf'
import React from 'react'
import { LinkedHeading, MDXProvider, Pre } from '@docpocalypse/gatsby-theme'
import PropDescription from '@docpocalypse/gatsby-theme/src/components/PropDescription.tsx'
import renderProps from '@docpocalypse/props-table'
// import Pre from '../../../components/Pre'

const propTypes = {}

const tokenMap = css`
  .union {
    & > *:not(:last-child)::after {
      content: ' | ';
    }
  }
`

const components = {
  pre: Pre,
}

function PropsTable({ metadata }) {
  const props = renderProps(metadata.props || [], { tokenMap })

  return (
    <>
      {props.map(prop => (
        <React.Fragment key={prop.name}>
          <LinkedHeading id={prop.name} h={3}>
            <div className="inline-flex items-center">
              <span className="font-mono mr-4">{prop.name}</span>
              {prop.propData.required && (
                <strong className="text-sm rounded bg-primary text-white px-3 leading-tight py-1">
                  required
                </strong>
              )}
            </div>
          </LinkedHeading>

          <div className="-mt-2 mb-3">
            <div>
              <strong>type:</strong>{' '}
              <span className="font-mono">{prop.type}</span>
            </div>
            {prop.defaultValue && (
              <>
                <strong>default</strong>: <code>{prop.defaultValue}</code>
              </>
            )}
          </div>

          <MDXProvider components={components}>
            <PropDescription
              mdx={prop.propData.description.childMdx}
              html={prop.description}
            />
          </MDXProvider>
        </React.Fragment>
      ))}
    </>
  )
}

PropsTable.propTypes = propTypes

export default PropsTable
