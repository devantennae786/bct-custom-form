import { mount } from 'enzyme'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { array, object, string } from 'yup'
import Form from '../src'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('FieldArray', () => {
  let schema = object({
    colors: array()
      .of(
        object({
          name: string().required(),
          hexCode: string().required(),
        }),
      )
      .default(() => [{ name: 'red', hexCode: '#ff0000' }]),
  })

  class ColorList extends React.Component {
    remove(index) {
      this.props.arrayHelpers.remove(this.props.value[index])
    }

    render() {
      const { value, name } = this.props
      // console.log('color list', value)
      return (
        <ul>
          {value.map((value, idx) => (
            <li key={`${value.hexCode}-${value.name}`}>
              <Form.Field name={`${name}[${idx}].name`} />
              <Form.Field name={`${name}[${idx}].hexCode`} />
            </li>
          ))}
        </ul>
      )
    }
  }

  const renderColorList = (props, meta, arrayHelpers) => (
    <ColorList {...props} arrayHelpers={arrayHelpers} />
  )

  it('should render forms correctly', () => {
    mount(
      <Form
        schema={schema}
        defaultValue={schema.default()}
        defaultErrors={{ 'colors[0].name': 'foo' }}
      >
        <Form.FieldArray name="colors">
          {({ value }) => (
            <ul>
              {value.map((value, idx) => (
                <li key={idx}>
                  <Form.Field
                    name={`colors[${idx}].name`}
                    errorClass="invalid"
                  />
                  <Form.Field name={`colors[${idx}].hexCode`} />
                </li>
              ))}
            </ul>
          )}
        </Form.FieldArray>
      </Form>,
    ).assertSingle('input.invalid')
  })

  it('should update the form value correctly', async () => {
    let value, last
    let changeSpy = sinon.spy(v => (value = v))

    let wrapper = mount(
      <Form
        schema={schema}
        defaultValue={schema.default()}
        onChange={changeSpy}
        defaultErrors={{ 'colors[0].name': 'foo' }}
      >
        <Form.FieldArray name="colors">
          {({ value }) => (
            <ul>
              {value.map((value, idx) => (
                <li key={idx}>
                  <Form.Field name={`colors[${idx}].name`} className="field" />
                  <Form.Field
                    name={`colors[${idx}].hexCode`}
                    className="field2"
                  />
                </li>
              ))}
            </ul>
          )}
        </Form.FieldArray>
      </Form>,
    )

    await act(() => {
      wrapper
        .find('.field')
        .first()
        .simulate('change', { target: { value: 'beige' } })

      return wait()
    })

    expect(changeSpy).have.been.calledOnce()

    expect(value).toEqual({
      colors: [
        {
          name: 'beige',
          hexCode: '#ff0000',
        },
      ],
    })

    last = value
    await act(() => {
      wrapper
        .find('.field2')
        .last()
        .simulate('change', { target: { value: 'LULZ' } })
      return wait()
    })
    expect(value).toEqual({
      colors: [
        {
          name: 'beige',
          hexCode: 'LULZ',
        },
      ],
    })

    expect(value).not.toBe(last)
  })

  it('should handle removing array items', async () => {
    let value
    let changeSpy = sinon.spy(v => (value = v))
    let defaultValue = {
      colors: [
        { name: 'red', hexCode: '#ff0000' },
        { name: 'other red', hexCode: '#ff0000' },
      ],
    }

    let wrapper = mount(
      <Form
        schema={schema}
        onChange={changeSpy}
        defaultValue={defaultValue}
        defaultErrors={{ 'colors[0].name': 'foo' }}
      >
        <Form.FieldArray name="colors">{renderColorList}</Form.FieldArray>
      </Form>,
    )

    let list = wrapper.find(ColorList)

    expect(list.prop('value')).toHaveLength(2)

    await act(() => {
      list.instance().remove(1)

      return wait()
    })

    expect(value).toEqual({
      colors: [
        {
          name: 'red',
          hexCode: '#ff0000',
        },
      ],
    })
  })

  it('should shift errors for removed fields', async () => {
    let value, errors
    let errorSpy = sinon.spy(v => (errors = v))
    let changeSpy = sinon.spy(v => (value = v))
    let defaultValue = {
      colors: [
        { name: '', hexCode: '#ff0000' },
        { name: 'other red', hexCode: '#ff0000' },
      ],
    }
    const ref = React.createRef()
    let wrapper = mount(
      <div>
        <Form
          ref={ref}
          schema={schema}
          onChange={changeSpy}
          onError={errorSpy}
          defaultValue={defaultValue}
        >
          <Form.FieldArray name="colors">{renderColorList}</Form.FieldArray>
        </Form>
      </div>,
    )
    let list = wrapper.find(ColorList)
    expect(list.prop('value')).toHaveLength(2)

    await act(() => ref.current.submit())

    // First color has an error
    expect(errors).toHaveProperty('colors[0].name')

    await act(() => {
      // remove the first color
      list.instance().remove(0)
      return wait()
    })
    // The error for the first color should be gone
    expect(errorSpy).have.been.calledTwice()
    expect(errors).not.toHaveProperty('colors[0].name')

    expect(value).toEqual({
      colors: [{ name: 'other red', hexCode: '#ff0000' }],
    })
  })
})
