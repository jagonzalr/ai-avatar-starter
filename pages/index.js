import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import buildspaceLogo from '../assets/buildspace-logo.png'

const Home = () => {
  const maxRetries = 20
  const [input, setInput] = useState('')
  const [finalPrompt, setFinalPrompt] = useState('')
  const [img, setImg] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [retry, setRetry] = useState(0)
  const [retryCount, setRetryCount] = useState(maxRetries)

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(
          `Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`
        )
        setRetryCount(maxRetries)
        setIsGenerating(false)
        return
      }

      console.log(`Trying again in ${retry} seconds.`)

      await sleep(retry * 1000)

      await onGenerate()
    }

    if (retry === 0) {
      return
    }

    runRetry()
  }, [retry])

  function onChange(e) {
    setInput(e.target.value)
  }

  async function onGenerate() {
    if (isGenerating && retry === 0) return

    setIsGenerating(true)

    // If this is a retry request, take away retryCount
    if (retry > 0) {
      setRetryCount(prevState => {
        if (prevState === 0) {
          return 0
        } else {
          return prevState - 1
        }
      })

      setRetry(0)
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg'
      },
      body: JSON.stringify({ input })
    })

    // Everything should be returned in json
    const data = await response.json()

    // If model still loading, drop that retry time
    if (response.status === 503) {
      setRetry(data.estimated_time)
      return
    }

    // If another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`)
      setIsGenerating(false)
      return
    }

    setFinalPrompt(input)
    setImg(data.image)
    setInput('')
    setIsGenerating(false)
  }

  const sleep = ms => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  return (
    <div className='root'>
      <Head>
        <title>AI Avatar Generator | buildspace</title>
      </Head>
      <div className='container'>
        <div className='header'>
          <div className='header-title'>
            <h1>AI Avatar Generator</h1>
          </div>
          <div className='header-subtitle'>
            <h2>
              Turn me into anyone you want! Make sure you refer to me as
              "jagonzalr" in the prompt
            </h2>
          </div>
          {/* Add prompt container here */}
          <div className='prompt-container'>
            <input className='prompt-box' value={input} onChange={onChange} />
          </div>
          {/* Add your prompt button in the prompt container */}
          <div className='prompt-buttons'>
            <a
              className={
                isGenerating ? 'generate-button loading' : 'generate-button'
              }
              onClick={onGenerate}
            >
              <div className='generate'>
                {isGenerating ? (
                  <span className='loader'></span>
                ) : (
                  <p>Generate</p>
                )}
              </div>
            </a>
          </div>
        </div>
        {img && (
          <div className='output-content'>
            <Image src={img} width={512} height={512} alt={input} />
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      <div className='badge-container grow'>
        <a
          href='https://buildspace.so/builds/ai-avatar'
          target='_blank'
          rel='noreferrer'
        >
          <div className='badge'>
            <Image src={buildspaceLogo} alt='buildspace logo' />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  )
}

export default Home
