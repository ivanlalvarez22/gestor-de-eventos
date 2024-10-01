import "./App.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { useState, useEffect, useCallback } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box"; // Importa Box

registerLocale("es", es);

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const validateFields = useCallback(() => {
    const validationErrors = {};
    if (!eventName.trim()) validationErrors.eventName = "Campo obligatorio";
    if (!eventDescription.trim())
      validationErrors.eventDescription = "Campo obligatorio";
    if (!location.trim()) validationErrors.location = "Campo obligatorio";
    if (!start) validationErrors.start = "Campo obligatorio";
    if (!end) validationErrors.end = "Campo obligatorio";
    if (start && end && start >= end)
      validationErrors.end = alert(
        "La fecha de finalización debe ser posterior a la de inicio"
      );

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [eventName, eventDescription, location, start, end]);

  useEffect(() => {
    if (!session) return;

    const pingAuthSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error al hacer ping a la sesión:", error);
        } else {
          console.log("Ping de sesión exitoso:", data);
        }
      } catch (err) {
        console.error("Error en la solicitud del ping de sesión:", err);
      }
    };

    pingAuthSession();
    const interval = setInterval(() => {
      pingAuthSession();
    }, 86400000);

    return () => clearInterval(interval);
  }, [session, supabase]);

  if (isLoading || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh", // O ajusta según tu diseño
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar",
        },
      });
      if (error) {
        throw new Error("Error iniciando sesión con Google en Supabase");
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCalendarEvent = async () => {
    if (!validateFields()) return;

    setLoading(true);
    const event = {
      summary: eventName,
      description: eventDescription,
      location: location,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const calendarId = "ivanlalvarez.22@gmail.com";

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "Hubo un error al crear el evento."
        );
      }

      console.log(data);
      alert("Evento creado, revise su Google Calendar");
    } catch (error) {
      console.error("Error al crear el evento:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="card">
        {session ? (
          <>
            <div>
              <h2 className="title">
                Hola{" "}
                <code style={{ color: "red", fontFamily: "Arial" }}>
                  {session.user.user_metadata.name}
                </code>
              </h2>

              <div className="input-group">
                <label>
                  Inicio de su evento{" "}
                  {errors.start && (
                    <span className="error"> {errors.start}</span>
                  )}
                </label>
                <DatePicker
                  selected={start}
                  onChange={setStart}
                  showTimeSelect
                  dateFormat="dd/MM/yyyy, p"
                  locale="es"
                  className={`input ${errors.start && "input-error"}`}
                  popperPlacement="bottom-start"
                />
              </div>

              <div className="input-group">
                <label>
                  Finalización de su evento{" "}
                  {errors.end && <span className="error"> {errors.end}</span>}
                </label>
                <DatePicker
                  selected={end}
                  onChange={setEnd}
                  showTimeSelect
                  dateFormat="dd/MM/yyyy, p"
                  locale="es"
                  className={`input ${errors.end && "input-error"}`}
                  popperPlacement="bottom-start"
                />
              </div>

              <div className="input-group">
                <label>
                  Nombre del evento *{" "}
                  {errors.eventName && (
                    <span className="error"> {errors.eventName}</span>
                  )}
                </label>
                <input
                  type="text"
                  onChange={(e) => setEventName(e.target.value)}
                  value={eventName}
                  className={`input ${errors.eventName && "input-error"}`}
                  placeholder="Ingrese el nombre de su evento"
                />
              </div>

              <div className="input-group">
                <label>
                  Descripción del evento *{" "}
                  {errors.eventDescription && (
                    <span className="error"> {errors.eventDescription}</span>
                  )}
                </label>
                <input
                  type="text"
                  onChange={(e) => setEventDescription(e.target.value)}
                  value={eventDescription}
                  className={`input ${
                    errors.eventDescription && "input-error"
                  }`}
                  placeholder="Ingrese la descripción de su evento"
                />
              </div>

              <div className="input-group">
                <label>
                  Ubicación del evento *{" "}
                  {errors.location && (
                    <span className="error"> {errors.location}</span>
                  )}
                </label>
                <input
                  type="text"
                  onChange={(e) => setLocation(e.target.value)}
                  value={location}
                  className={`input ${errors.location && "input-error"}`}
                  placeholder="Ingrese la ubicación de su evento"
                />
              </div>

              <div className="buttons">
                <button
                  className="btn primary"
                  onClick={createCalendarEvent}
                  disabled={loading}
                >
                  Crear evento
                </button>
                <button
                  className="btn secondary"
                  onClick={signOut}
                  disabled={loading}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        ) : (
          <button className="btn primary" onClick={googleSignIn}>
            Iniciar sesión con Google
          </button>
        )}
      </div>
      <div className="googleCalendarContainer">
        <div className="googleCalendar">
          <iframe
            title="Google Calendar"
            src="https://calendar.google.com/calendar/embed?src=ivanlalvarez.22%40gmail.com&ctz=America%2FArgentina%2FSalta"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
