\section{GrainClassifier}

GrainClassifier is a mobile (Expo React Native) application with a Flask backend that uses an Ultralytics YOLOv8 classification model to identify grain types (for example, \texttt{type\_1}, \texttt{type\_2}, \texttt{toor}, etc.) from an image and return the prediction confidence.

\subsection{Repository Structure}

\begin{itemize}
  \item \texttt{backend-flask/} -- Flask API and model loading code.
  \item \texttt{frontend-expo/} -- Expo React Native frontend.
  \item \texttt{backend-flask/model/} -- directory for trained YOLO weights (\texttt{model.pt}, not tracked in VCS).
\end{itemize}

\subsection{Backend (Flask + Ultralytics)}

\subsubsection{Prerequisites}

\begin{itemize}
  \item Python 3.10 or 3.11.
  \item \texttt{pip}.
\end{itemize}

\subsubsection{Setup}

From \texttt{backend-flask}:

\begin{verbatim}
python3.11 -m venv venv     # or python3.10
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install ultralytics flask flask-cors pillow
\end{verbatim}

If you maintain a \texttt{requirements.txt}, you can instead run:

\begin{verbatim}
pip install -r requirements.txt
\end{verbatim}

Copy your trained YOLOv8 classification weights to:

\begin{verbatim}
backend-flask/model/model.pt
\end{verbatim}

\subsubsection{Running the Backend}

With the virtual environment active:

\begin{verbatim}
python server.py
\end{verbatim}

The service exposes:

\begin{itemize}
  \item \textbf{GET} \texttt{/health} -- basic status and \texttt{model\_loaded} flag.
  \item \textbf{POST} \texttt{/predict} -- accepts JSON with:
\end{itemize}

\begin{verbatim}
{
  "grain_type": "toor",
  "image_base64": "<base64-encoded image data>"
}
\end{verbatim}

Response example:

\begin{verbatim}
{
  "predicted_class": "type_2",
  "confidence": 0.98
}
\end{verbatim}

\subsection{Frontend (Expo React Native)}

\subsubsection{Prerequisites}

\begin{itemize}
  \item Node.js and npm or yarn.
  \item Expo CLI (via \texttt{npx expo}).
\end{itemize}

From \texttt{frontend-expo}:

\begin{verbatim}
npm install        # or: yarn
npx expo start
\end{verbatim}

The frontend:

\begin{itemize}
  \item Allows the user to select a grain type from a picker.
  \item Captures or selects an image and encodes it as base64.
  \item Sends a \textbf{POST} request to the backend's \texttt{/predict} endpoint with \texttt{grain\_type} and \texttt{image\_base64}.
  \item Displays \texttt{predicted\_class} and \texttt{confidence} returned by the backend.
\end{itemize}

Configure \texttt{SERVER\_URL} in the frontend to point to your backend instance, for example:

\begin{verbatim}
const SERVER_URL = 'http://192.168.29.46:5001';
\end{verbatim}

For a physical device, this must be the machine's LAN IP, not \texttt{127.0.0.1}.

\subsection{Networking Notes}

\begin{itemize}
  \item Backend default bind: \texttt{0.0.0.0:5001}.
  \item Devices running the Expo app must be on the same network as the backend host.
  \item You can verify connectivity via \texttt{http://<your-ip>:5001/health} in a mobile browser.
\end{itemize}

\subsection{Version Control}

Recommended ignore rules:

\begin{itemize}
  \item \texttt{backend-flask/venv/}
  \item \texttt{backend-flask/model/*.pt}
  \item \texttt{frontend-expo/node\_modules/}
  \item Any local environment files (for example \texttt{.env}, \texttt{.env.local} as applicable).
\end{itemize}

Store secrets, local IPs, and model weights outside of version control.
