import { mount } from 'enzyme'
import React from 'react'
import { act } from 'react-dom/test-utils'
import * as yup from 'yup'
import Form, { useFormSubmit } from '../src'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Triggers', () => {
  const schema = yup.object({ fieldA: yup.mixed(), fieldB: yup.mixed() })

  it('should simulate event for name', () => {
    let spy = sinon.spy(),
      wrapper = mount(
        <Form schema={schema} onValidate={spy}>
          <div>
            <Form.Field name="fieldA" noMeta>
              {props => <input {...props} value={props.value || ''} />}
            </Form.Field>
          </div>
        </Form>,
      )

    wrapper.find('input').simulate('change')

    spy.should.have.been.calledOnce()
    spy.args[0][0].fields.should.eql(['fieldA'])
  })

  it('should simulate event once with multiple names', () => {
    let spy = sinon.spy(),
      wrapper = mount(
        <Form schema={schema} onValidate={spy}>
          <div>
            <Form.Submit triggers={['fieldA', 'fieldB']} />
          </div>
        </Form>,
      )

    wrapper.find('button').simulate('click')

    spy.should.have.been.calledOnce()
    spy.args[0][0].fields.should.eql(['fieldA', 'fieldB'])
  })

  it('should simulate for `triggers`', async () => {
    const spy = sinon.spy(({ fields }) => {
      fields.should.eql(['fieldA'])
    })

    let wrapper = mount(
      <Form schema={schema} onValidate={spy}>
        <div>
          <Form.Field name={'fieldA'}>
            {props => <input {...props} value={props.value || ''} />}
          </Form.Field>
          <Form.Field name={'fieldB'}>
            {props => <input {...props} value={props.value || ''} />}
          </Form.Field>

          <Form.Submit events="onClick" triggers={['fieldA']} />
        </div>
      </Form>,
    )

    await act(() => {
      wrapper.find('button').simulate('click')
      return wait()
    })

    expect(spy).to.have.been.calledOnce()
  })

  it('should trigger a submit', async () => {
    const spy = sinon.spy()

    let wrapper = mount(
      <Form schema={schema} onSubmit={spy}>
        <div>
          <Form.Field name="fieldA">
            {({ props }) => <input {...props} />}
          </Form.Field>

          <Form.Field name="fieldB">
            {({ props }) => <input {...props} />}
          </Form.Field>

          <Form.Submit />
        </div>
      </Form>,
    )

    await act(() => {
      wrapper.find('button').simulate('click')
      return wait()
    })
    expect(spy).to.have.been.calledOnce()
  })

  it('Field should handle submitting state', async () => {
    let spy = sinon.spy(() => wait(50))
    let ref = React.createRef()

    let wrapper = mount(
      <div>
        <Form ref={ref} schema={schema} submitForm={spy}>
          <div>
            <Form.Field name="fieldA">
              {(_, meta) => <span>submitting: {String(meta.submitting)}</span>}
            </Form.Field>
          </div>
        </Form>
      </div>,
    )

    let trigger = wrapper.find('span')

    trigger.text().should.equal('submitting: false')

    await act(async () => {
      let promise = ref.current.submit()

      await wait()

      trigger.text().should.equal('submitting: true')

      return promise
    })

    trigger.text().should.equal('submitting: false')
  })

  it('Submit should handle submitting state', async () => {
    let ref = React.createRef()
    let spy = sinon.spy(() => wait(50))

    function Submit(props) {
      const [, { submitting, submitCount }] = useFormSubmit(props)

      return (
        <span>
          {String(submitting)}: {String(submitCount)}
        </span>
      )
    }

    let wrapper = mount(
      <div>
        <Form ref={ref} schema={schema} submitForm={spy}>
          <div>
            <Submit name="fieldA" />
          </div>
        </Form>
      </div>,
    )

    let trigger = wrapper.find('span')

    trigger.text().should.equal('false: 0')

    await act(async () => {
      let promise = ref.current.submit()

      await wait()

      trigger.text().should.equal('true: 0')

      return promise
    })

    trigger.text().should.equal('false: 1')
  })
})
